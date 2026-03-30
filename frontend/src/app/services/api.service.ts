// Service containing business logic for api.service
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AuthResponse, User, LeaderboardEntry, Quiz, Question,
  AttemptResponse, Badge, Reward, Policy, UserPolicy,
  PremiumBreakdown, DiscountRule, EducationContent, Claim, UnderwriterStats, UserRewardResponse,
  RegisterRequest, LoginRequest, ResetPasswordRequest, PremiumCalculationLog
} from '../models/models';

const API = 'https://iqsure-app-12345-bpcmgcfpdmgegpa4.eastasia-01.azurewebsites.net';
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/api/auth/register`, data);
  }
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/api/auth/login`, data);
  }
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${API}/api/auth/forgot-password`, { email });
  }
  resetPassword(data: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${API}/api/auth/reset-password`, data);
  }
  getProfile(userId: number): Observable<User> {
    return this.http.get<User>(`${API}/api/v1/users/${userId}`);
  }
  updateProfile(userId: number, data: any): Observable<User> {
    return this.http.put<User>(`${API}/api/v1/users/${userId}`, data);
  }
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API}/api/v1/users`);
  }
  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${API}/api/v1/users/${userId}`);
  }
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${API}/api/v1/users/leaderboard`);
  }
  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${API}/api/v1/users/role/${role}`);
  }
  updateUserStatus(userId: number, status: string): Observable<User> {
    return this.http.put<User>(`${API}/api/v1/users/${userId}/status?status=${status}`, {});
  }
  createUnderwriter(data: any): Observable<User> {
    return this.http.post<User>(`${API}/api/v1/users/underwriter`, data);
  }
  createClaimsOfficer(data: any): Observable<User> {
    return this.http.post<User>(`${API}/api/v1/users/claims-officer`, data);
  }
  getAllClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${API}/api/v1/claims`);
  }
  getAllClaimsAdmin(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${API}/api/v1/claims/all`);
  }
  getClaimsByUser(userId: number): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${API}/api/v1/claims/user/${userId}`);
  }
  getClaimById(claimId: number): Observable<Claim> {
    return this.http.get<Claim>(`${API}/api/v1/claims/${claimId}`);
  }
  fileClaim(userId: number, userPolicyId: number, data: any): Observable<Claim> {
    return this.http.post<Claim>(`${API}/api/v1/claims/file?userId=${userId}&userPolicyId=${userPolicyId}`, data);
  }
  assignClaimOfficer(claimId: number, officerId: number): Observable<Claim> {
    return this.http.put<Claim>(`${API}/api/v1/claims/${claimId}/assign?officerId=${officerId}`, {});
  }
  processClaim(claimId: number, status: string, remarks: string, approvedAmount?: number): Observable<Claim> {
    const amountParam = approvedAmount !== undefined ? `&approvedAmount=${approvedAmount}` : '';
    return this.http.put<Claim>(`${API}/api/v1/claims/${claimId}/process?status=${status}&remarks=${encodeURIComponent(remarks)}${amountParam}`, {});
  }
  settleClaim(claimId: number, settlementAmount: number): Observable<Claim> {
    return this.http.put<Claim>(`${API}/api/v1/claims/${claimId}/settle?settlementAmount=${settlementAmount}`, {});
  }
  aiInvestigateClaim(claimId: number): Observable<any> {
    return this.http.get<any>(`${API}/api/v1/claims/${claimId}/ai-investigate`);
  }

  getAllUserPoliciesAdmin(): Observable<UserPolicy[]> {
    return this.http.get<UserPolicy[]>(`${API}/api/v1/admin/pipeline/policies`);
  }
  getPoliciesByStatus(status: string): Observable<UserPolicy[]> {
    return this.http.get<UserPolicy[]>(`${API}/api/v1/admin/pipeline/policies/status?status=${status}`);
  }
  assignUnderwriter(userPolicyId: number, underwriterId: number): Observable<UserPolicy> {
    return this.http.put<UserPolicy>(`${API}/api/v1/admin/pipeline/policies/${userPolicyId}/assign?underwriterId=${underwriterId}`, {});
  }
  sendQuote(userPolicyId: number, quoteAmount: number, remarks: string): Observable<UserPolicy> {
    return this.http.put<UserPolicy>(`${API}/api/v1/admin/pipeline/policies/${userPolicyId}/quote`, { quoteAmount, remarks });
  }
  activatePolicyByAdmin(userPolicyId: number): Observable<UserPolicy> {
    return this.http.put<UserPolicy>(`${API}/api/v1/admin/pipeline/policies/${userPolicyId}/activate`, {});
  }
  rejectPolicy(userPolicyId: number, remarks: string): Observable<UserPolicy> {
    return this.http.put<UserPolicy>(`${API}/api/v1/admin/pipeline/policies/${userPolicyId}/reject`, { remarks });
  }
  getUnderwriterStats(underwriterId: number): Observable<UnderwriterStats> {
    return this.http.get<UnderwriterStats>(`${API}/api/v1/admin/pipeline/underwriter/stats?underwriterId=${underwriterId}`);
  }
  getClaimsOfficerStats(officerId: number): Observable<any> {
    return this.http.get<any>(`${API}/api/v1/admin/pipeline/officer/stats?officerId=${officerId}`);
  }
  getAiAnalysis(policyId: number): Observable<any> {
    return this.http.get<any>(`${API}/api/v1/admin/pipeline/policies/${policyId}/ai-analysis`);
  }
  getAllQuizzes(): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${API}/api/v1/quizzes`);
  }
  getQuizById(quizId: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${API}/api/v1/quizzes/${quizId}`);
  }
  getQuestionsByQuiz(quizId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${API}/api/v1/questions/quiz/${quizId}`);
  }
  submitQuiz(userId: number, data: { quizId: number; answers: { [questionId: number]: number }, speedBonus?: number }): Observable<AttemptResponse> {
    return this.http.post<AttemptResponse>(`${API}/api/v1/attempts?userId=${userId}`, data);
  }
  getAttemptsByUser(userId: number): Observable<AttemptResponse[]> {
    return this.http.get<AttemptResponse[]>(`${API}/api/v1/attempts?userId=${userId}`);
  }
  getAllBadges(): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${API}/api/v1/badges`);
  }
  getBadgesByUser(userId: number): Observable<Badge[]> {
    return this.http.get<Badge[]>(`${API}/api/v1/badges/user/${userId}`);
  }
  getAllRewards(): Observable<Reward[]> {
    return this.http.get<Reward[]>(`${API}/api/v1/rewards`);
  }
  getEarnedRewardsByUser(userId: number): Observable<UserRewardResponse[]> {
    return this.http.get<UserRewardResponse[]>(`${API}/api/v1/rewards/user/${userId}/earned`);
  }
  redeemReward(rewardId: number, userId: number): Observable<any> {
    return this.http.post<any>(`${API}/api/v1/rewards/${rewardId}/redeem?userId=${userId}`, {});
  }
  getActivePolicies(): Observable<Policy[]> {
    return this.http.get<Policy[]>(`${API}/api/v1/policies`);
  }
  calculatePremium(userId: number, policyId: number, selectedRewardIds: number[] = []): Observable<PremiumBreakdown> {
    const params = selectedRewardIds.length > 0 ? '?selectedRewardIds=' + selectedRewardIds.join('&selectedRewardIds=') : '';
    return this.http.get<PremiumBreakdown>(`${API}/api/v1/users/${userId}/premium/calculate/${policyId}${params}`);
  }
  purchasePolicy(userId: number, data: { policyId: number, rewardIds?: number[] }, selectedRewardIds: number[] = []): Observable<UserPolicy> {
    const params = selectedRewardIds.length > 0 ? '?selectedRewardIds=' + selectedRewardIds.join('&selectedRewardIds=') : '';
    return this.http.post<UserPolicy>(`${API}/api/v1/users/${userId}/policies${params}`, data);
  }
  getUserPolicies(userId: number): Observable<UserPolicy[]> {
    return this.http.get<UserPolicy[]>(`${API}/api/v1/users/${userId}/policies`);
  }
  getPremiumLogs(userId: number): Observable<PremiumCalculationLog[]> {
    return this.http.get<PremiumCalculationLog[]>(`${API}/api/v1/users/${userId}/premium/logs`);
  }
  getAvailableRewardsForUser(userId: number): Observable<UserRewardResponse[]> {
    return this.http.get<UserRewardResponse[]>(`${API}/api/v1/users/${userId}/premium/available-rewards`);
  }
  getAllPolicies(): Observable<Policy[]> {
    return this.http.get<Policy[]>(`${API}/api/v1/policies/all`);
  }
  createPolicy(data: Partial<Policy>): Observable<Policy> {
    return this.http.post<Policy>(`${API}/api/v1/policies`, data);
  }
  updatePolicy(policyId: number, data: Partial<Policy>): Observable<Policy> {
    return this.http.put<Policy>(`${API}/api/v1/policies/${policyId}`, data);
  }
  deletePolicy(policyId: number): Observable<void> {
    return this.http.delete<void>(`${API}/api/v1/policies/${policyId}`);
  }
  getAllDiscountRules(): Observable<DiscountRule[]> {
    return this.http.get<DiscountRule[]>(`${API}/api/v1/discount-rules/all`);
  }
  createDiscountRule(data: any): Observable<DiscountRule> {
    return this.http.post<DiscountRule>(`${API}/api/v1/discount-rules`, data);
  }
  updateDiscountRule(ruleId: number, data: any): Observable<DiscountRule> {
    return this.http.put<DiscountRule>(`${API}/api/v1/discount-rules/${ruleId}`, data);
  }
  deleteDiscountRule(ruleId: number): Observable<void> {
    return this.http.delete<void>(`${API}/api/v1/discount-rules/${ruleId}`);
  }
  createBadge(data: any): Observable<Badge> {
    return this.http.post<Badge>(`${API}/api/v1/badges`, data);
  }
  updateBadge(badgeId: number, data: any): Observable<Badge> {
    return this.http.put<Badge>(`${API}/api/v1/badges/${badgeId}`, data);
  }
  deleteBadge(badgeId: number): Observable<void> {
    return this.http.delete<void>(`${API}/api/v1/badges/${badgeId}`);
  }
  createQuiz(data: any): Observable<Quiz> {
    return this.http.post<Quiz>(`${API}/api/v1/quizzes`, data);
  }
  updateQuiz(quizId: number, data: any): Observable<Quiz> {
    return this.http.put<Quiz>(`${API}/api/v1/quizzes/${quizId}`, data);
  }
  deleteQuiz(quizId: number): Observable<void> {
    return this.http.delete<void>(`${API}/api/v1/quizzes/${quizId}`);
  }
  addQuestion(data: any): Observable<Question> {
    return this.http.post<Question>(`${API}/api/v1/questions`, data);
  }
  addAnswer(data: any): Observable<any> {
    return this.http.post<any>(`${API}/api/v1/questions/answers`, data);
  }
  deleteQuestion(questionId: number): Observable<void> {
    return this.http.delete<void>(`${API}/api/v1/questions/${questionId}`);
  }
  createReward(data: any): Observable<Reward> {
    return this.http.post<Reward>(`${API}/api/v1/rewards`, data);
  }
  deleteReward(rewardId: number): Observable<void> {
    return this.http.delete<void>(`${API}/api/v1/rewards/${rewardId}`);
  }
  getEducationContentByLanguage(language: string): Observable<EducationContent[]> {
    return this.http.get<EducationContent[]>(`${API}/api/v1/education?language=${language}`);
  }
  getNotifications(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API}/api/v1/notifications/user/${userId}`);
  }
  markNotificationAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${API}/api/v1/notifications/${notificationId}/read`, {});
  }
  markAllNotificationsAsRead(userId: number): Observable<void> {
    return this.http.put<void>(`${API}/api/v1/notifications/user/${userId}/read-all`, {});
  }
  generateHealthDeclaration(data: any): Observable<any> {
    return this.http.post<any>(`${API}/api/v1/documents/generate-health-declaration`, data);
  }
  generateClaimLetter(data: any): Observable<any> {
    return this.http.post<any>(`${API}/api/v1/documents/generate-claim-letter`, data);
  }
  uploadFile(file: File): Observable<{ filePath: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ filePath: string }>(`${API}/api/v1/files/upload`, formData);
  }
  getTtsAudio(text: string, language: string): Observable<Blob> {
    return this.http.get(`${API}/api/ai-academy/tts`, {
      params: { text, language },
      responseType: 'blob'
    });
  }
  payPolicy(userId: number, userPolicyId: number): Observable<any> {
    return this.http.put<any>(`${API}/api/v1/users/${userId}/policies/${userPolicyId}/pay`, {});
  }
  getUnderwriterPoliciesByStatus(underwriterId: number, status?: string): Observable<any[]> {
    const statusParam = status ? `?status=${status}` : '';
    return this.http.get<any[]>(`${API}/api/v1/admin/pipeline/underwriter/${underwriterId}/policies${statusParam}`);
  }
  generateAiLesson(topic: string, lang: string = 'English'): Observable<EducationContent> {
    return this.http.get<EducationContent>(`${API}/api/ai-academy/generate-lesson?topic=${encodeURIComponent(topic)}&lang=${lang}`);
  }
  generateAiQuiz(context: string, lang: string = 'English'): Observable<Question[]> {
    return this.http.post<Question[]>(`${API}/api/ai-academy/generate-quiz?lang=${lang}`, context);
  }
  completeAcademyLesson(userId: number, topic: string, score: number, total: number, reportJson?: string): Observable<User> {
    const body = { userId, topic, score, total, reportJson };
    return this.http.post<User>(`${API}/api/ai-academy/complete-lesson`, body);
  }
  askOracleFollowUp(context: string, doubt: string, lang: string = 'English'): Observable<string> {
    const params = new URLSearchParams({ context, doubt, lang }).toString();
    return this.http.post(`${API}/api/ai-academy/ask-follow-up?${params}`, {}, { responseType: 'text' });
  }
}
