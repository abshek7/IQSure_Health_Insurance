package org.hartford.iqsure.service;

import lombok.extern.slf4j.Slf4j;
import org.hartford.iqsure.dto.response.EducationContentDTO;
import org.hartford.iqsure.dto.response.QuestionResponseDTO;
import org.hartford.iqsure.entity.Attempt;
import org.hartford.iqsure.entity.User;
import org.hartford.iqsure.exception.ResourceNotFoundException;
import org.hartford.iqsure.repository.AttemptRepository;
import org.hartford.iqsure.repository.UserRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;   
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AIAcademyService {

    private final ChatClient chatClient;
    private final UserRepository userRepository;
    private final AttemptRepository attemptRepository;
    private final BadgeService badgeService;

    @Value("${openai.api.key}")
    private String apiKey;

    public AIAcademyService(ChatClient.Builder chatClientBuilder,
                            UserRepository userRepository,
                            BadgeService badgeService,
                            AttemptRepository attemptRepository) {
        this.chatClient = chatClientBuilder.build();
        this.userRepository = userRepository;
        this.badgeService = badgeService;
        this.attemptRepository = attemptRepository;
    }

    @Transactional
    public void rewardCompletion(Long userId, String topic, int score, int total, String reportJson) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        int bonus = (score * 10);
        int points = (user.getUserPoints() != null) ? user.getUserPoints() : 0;
        user.setUserPoints(points + bonus);

        int quizzes = (user.getTotalQuizzesTaken() != null) ? user.getTotalQuizzesTaken() : 0;
        user.setTotalQuizzesTaken(quizzes + 1);

        LocalDate today = LocalDate.now();
        int streak = (user.getCurrentStreak() != null) ? user.getCurrentStreak() : 0;

        if (user.getLastQuizDate() == null) {
            user.setCurrentStreak(1);
        } else {
            long daysBetween = ChronoUnit.DAYS.between(user.getLastQuizDate(), today);
            if (daysBetween == 1) {
                user.setCurrentStreak(streak + 1);
            } else if (daysBetween > 1) {
                user.setCurrentStreak(1);
            }
        }

        user.setLastQuizDate(today);

        int currentXp = (user.getExperiencePoints() != null) ? user.getExperiencePoints() : 0;
        int xpGained = (score * 100) + (user.getCurrentStreak() * 20);
        user.setExperiencePoints(currentXp + xpGained);

        int integrity = (user.getFortressIntegrity() != null) ? user.getFortressIntegrity() : 50;
        double scorePercent = (double) score / total;

        if (scorePercent >= 0.8) {
            user.setFortressIntegrity(Math.min(100, integrity + 8));
        } else if (scorePercent < 0.5) {
            user.setFortressIntegrity(Math.max(10, integrity - 5));
        }

        int xp = user.getExperiencePoints();
        if (xp > 5000) user.setRank("OVERLORD_OF_SECURITY");
        else if (xp > 2000) user.setRank("AEGIS_MASTER");
        else if (xp > 500) user.setRank("SENTINEL_OF_RISK");
        else user.setRank("NOVICE_GUARDIAN");

        userRepository.save(user);

        Attempt attempt = Attempt.builder()
                .user(user)
                .quizTitle(topic)
                .score(score)
                .totalQuestions(total)
                .percentage((int) ((double) score / total * 100))
                .pointsEarned(bonus)
                .questionReportJson(reportJson)
                .build();

        attemptRepository.save(attempt);
        badgeService.checkAndAwardBadges(userId);

        log.info("Recorded academy completion for user {}: {} points earned", userId, bonus);
    }

    public EducationContentDTO generateLesson(String topic, String language) {

        log.info("Using API Key: {}", apiKey != null ? "LOADED ✅" : "MISSING ❌");

        String prompt = String.format(
            "You are an insurance expert with 30 years of experience. " +
            "Generate a professional, high-quality educational lesson for the topic: '%s' in language: '%s'. " +
            "Return ONLY JSON with fields: title, topic, content.",
            topic, language
        );

        return chatClient.prompt()
                .user(prompt)
                .call()
                .entity(EducationContentDTO.class);
    }

    public String generateFollowUp(String context, String doubt, String language) {
        String prompt = String.format(
            "You are an insurance mentor. Topic: '%s'. Doubt: '%s'. Answer in %s.",
            context, doubt, language
        );

        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }

    public List<QuestionResponseDTO> generateQuiz(String context, String language) {

        String prompt = String.format(
            "Generate 5 MCQs in %s. Return JSON array only. Context: %s",
            language, context
        );

        List<AICalibratedQuestion> aiQuestions = chatClient.prompt()
                .user(prompt)
                .call()
                .entity(new ParameterizedTypeReference<List<AICalibratedQuestion>>() {});

        if (aiQuestions == null) return List.of();

        return aiQuestions.stream()
                .map(q -> QuestionResponseDTO.builder()
                        .text(q.text)
                        .options(q.options)
                        .correctOptionIndex(q.correctOptionIndex)
                        .explanation(q.explanation)
                        .build())
                .collect(Collectors.toList());
    }

    public static class AICalibratedQuestion {
        public String text;
        public List<String> options;
        public int correctOptionIndex;
        public String explanation;
    }
}
