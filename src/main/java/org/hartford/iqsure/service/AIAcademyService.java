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
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AIAcademyService {

    // ===== Constants (avoid magic numbers) =====
    private static final int POINTS_MULTIPLIER = 10;
    private static final int XP_SCORE_MULTIPLIER = 100;
    private static final int XP_STREAK_MULTIPLIER = 20;
    private static final int MAX_INTEGRITY = 100;
    private static final int MIN_INTEGRITY = 10;

    private final ChatClient chatClient;
    private final UserRepository userRepository;
    private final AttemptRepository attemptRepository;
    private final BadgeService badgeService;

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

        if (total <= 0) {
            throw new IllegalArgumentException("Total questions must be greater than 0");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        int bonus = score * POINTS_MULTIPLIER;
        int points = Objects.requireNonNullElse(user.getUserPoints(), 0);
        user.setUserPoints(points + bonus);

        int quizzes = Objects.requireNonNullElse(user.getTotalQuizzesTaken(), 0);
        user.setTotalQuizzesTaken(quizzes + 1);

        updateStreak(user);
        updateXP(user, score);
        updateIntegrity(user, score, total);
        updateRank(user);

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

    // ===== Helper Methods =====

    private void updateStreak(User user) {
        LocalDate today = LocalDate.now();
        int streak = Objects.requireNonNullElse(user.getCurrentStreak(), 0);

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
    }

    private void updateXP(User user, int score) {
        int currentXp = Objects.requireNonNullElse(user.getExperiencePoints(), 0);
        int xpGained = (score * XP_SCORE_MULTIPLIER) + (user.getCurrentStreak() * XP_STREAK_MULTIPLIER);
        user.setExperiencePoints(currentXp + xpGained);
    }

    private void updateIntegrity(User user, int score, int total) {
        int integrity = Objects.requireNonNullElse(user.getFortressIntegrity(), 50);
        double scorePercent = (double) score / total;

        if (scorePercent >= 0.8) {
            user.setFortressIntegrity(Math.min(MAX_INTEGRITY, integrity + 8));
        } else if (scorePercent < 0.5) {
            user.setFortressIntegrity(Math.max(MIN_INTEGRITY, integrity - 5));
        }
    }

    private void updateRank(User user) {
        int xp = user.getExperiencePoints();

        if (xp > 5000) user.setRank("OVERLORD_OF_SECURITY");
        else if (xp > 2000) user.setRank("AEGIS_MASTER");
        else if (xp > 500) user.setRank("SENTINEL_OF_RISK");
        else user.setRank("NOVICE_GUARDIAN");
    }

    // ===== AI METHODS =====

    public EducationContentDTO generateLesson(String topic, String language) {
        String prompt = String.format(
                "You are an insurance expert with 30 years of experience. " +
                        "Generate a professional lesson for topic: '%s' in '%s'. " +
                        "Return ONLY valid JSON with fields: title, topic, content.",
                topic, language
        );

        try {
            return chatClient.prompt()
                    .user(prompt)
                    .call()
                    .entity(EducationContentDTO.class);
        } catch (Exception e) {
            log.error("AI lesson generation failed", e);
            throw new RuntimeException("Failed to generate lesson");
        }
    }

    public String generateFollowUp(String context, String doubt, String language) {
        String prompt = String.format(
                "Explain '%s' doubt '%s' clearly in %s.",
                context, doubt, language
        );

        try {
            return chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("AI follow-up failed", e);
            return "Unable to process your request right now.";
        }
    }

    public List<QuestionResponseDTO> generateQuiz(String context, String language) {
        String prompt = String.format(
                "Generate 5 MCQs in %s. Return ONLY JSON array. Context: %s",
                language, context
        );

        try {
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

        } catch (Exception e) {
            log.error("AI quiz generation failed", e);
            return List.of();
        }
    }

    public static class AICalibratedQuestion {
        public String text;
        public List<String> options;
        public int correctOptionIndex;
        public String explanation;
    }
}
