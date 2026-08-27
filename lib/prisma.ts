// lib/prisma.ts
// Version simplificada sin base de datos: datos temporales en memoria.

export interface User {
  id: string;
  displayName: string;
  avatarKey: string;
  roleClass: string;
  socketId?: string;
  isConnected: boolean;
}

export interface Team {
  id: string;
  gameSessionId: string;
  name: string;
  currentStage: number;
  totalCorrect: number;
  totalTimeSeconds: number;
  finalScore: number;
  members: string[];
}

export interface Question {
  id: string;
  stageId: string;
  questionType: string;
  questionText: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string;
  pointsBase: number;
  imageUrl?: string;
  difficulty?: string;
  isActive?: boolean;
  timeLimitSeconds?: number;
}

export interface GameSession {
  id: string;
  name: string;
  status: string;
  maxPlayers: number;
  minPlayers: number;
}

export interface PlayerAnswer {
  id: string;
  gameSessionId: string;
  teamId: string;
  userId: string;
  stageId: string;
  questionId: string;
  submittedAnswer: string;
  isCorrect: boolean;
  responseTimeSeconds: number;
  pointsAwarded: number;
  submittedAt: Date;
}

class InMemoryDB {
  private users: Map<string, User> = new Map();
  private teams: Map<string, Team> = new Map();
  private gameSessions: Map<string, GameSession> = new Map();
  private questions: Map<string, Question> = new Map();
  private playerAnswers: Map<string, PlayerAnswer> = new Map();

  // Users
  async createUser(data: Partial<User>) {
    const id = Math.random().toString(36).substring(2, 11);
    const user: User = {
      id,
      displayName: data.displayName || 'Aventurero',
      avatarKey: data.avatarKey || 'caballero',
      roleClass: data.roleClass || data.avatarKey || 'caballero',
      socketId: data.socketId,
      isConnected: data.isConnected ?? true,
    };

    this.users.set(id, user);
    return user;
  }

  async findUserById(id: string) {
    return this.users.get(id) || null;
  }

  async getAllUsers() {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, data: Partial<User>) {
    const user = this.users.get(id);
    if (!user) return null;

    const updated: User = { ...user, ...data, id: user.id };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string) {
    return this.users.delete(id);
  }

  // Teams
  async createTeam(data: Partial<Team>) {
    const id = Math.random().toString(36).substring(2, 11);
    const team: Team = {
      id,
      gameSessionId: data.gameSessionId || 'default',
      name: data.name || 'Equipo',
      currentStage: data.currentStage || 1,
      totalCorrect: data.totalCorrect || 0,
      totalTimeSeconds: data.totalTimeSeconds || 0,
      finalScore: data.finalScore || 0,
      members: data.members || [],
    };

    this.teams.set(id, team);
    return team;
  }

  async findTeamById(id: string) {
    return this.teams.get(id) || null;
  }

  async getTeamsBySession(sessionId: string) {
    return Array.from(this.teams.values()).filter(
      team => team.gameSessionId === sessionId
    );
  }

  async getTeamMembers(teamId: string) {
    const team = this.teams.get(teamId);
    if (!team) return [];

    return team.members
      .map(userId => this.users.get(userId))
      .filter((user): user is User => Boolean(user));
  }

  async updateTeam(id: string, data: Partial<Team>) {
    const team = this.teams.get(id);
    if (!team) return null;

    const updated: Team = { ...team, ...data, id: team.id };
    this.teams.set(id, updated);
    return updated;
  }

  // Game sessions
  async createGameSession(data: Partial<GameSession>) {
    const id = data.id || Math.random().toString(36).substring(2, 11);
    const session: GameSession = {
      id,
      name: data.name || 'Conquista del Calabozo',
      status: data.status || 'waiting',
      maxPlayers: data.maxPlayers || 50,
      minPlayers: data.minPlayers || 2,
    };

    this.gameSessions.set(id, session);
    return session;
  }

  async findGameSessionById(id: string) {
    return this.gameSessions.get(id) || null;
  }

  async getOrCreateGameSession(id: string) {
    const existing = this.gameSessions.get(id);
    if (existing) return existing;

    return this.createGameSession({ id });
  }

  // Questions
  async addQuestion(data: Partial<Question>) {
    const id = Math.random().toString(36).substring(2, 11);
    const question = { ...data, id } as Question;
    this.questions.set(id, question);
    return question;
  }

  async getQuestionsByStage(stageId: string) {
    return Array.from(this.questions.values()).filter(
      question => question.stageId === stageId
    );
  }

  async findQuestionById(id: string) {
    return this.questions.get(id) || null;
  }

  async updateQuestion(id: string, data: Partial<Question>) {
    const question = this.questions.get(id);
    if (!question) return null;

    const updated: Question = { ...question, ...data, id: question.id };
    this.questions.set(id, updated);
    return updated;
  }

  async deleteQuestion(id: string) {
    return this.questions.delete(id);
  }

  // Player answers
  async findPlayerAnswer(teamId: string, userId: string, questionId: string) {
    return (
      Array.from(this.playerAnswers.values()).find(
        answer =>
          answer.teamId === teamId &&
          answer.userId === userId &&
          answer.questionId === questionId
      ) || null
    );
  }

  async createPlayerAnswer(data: Omit<PlayerAnswer, 'id'>) {
    const id = Math.random().toString(36).substring(2, 11);
    const answer: PlayerAnswer = { ...data, id };
    this.playerAnswers.set(id, answer);
    return answer;
  }

  async getAnswersByTeam(teamId: string) {
    return Array.from(this.playerAnswers.values()).filter(
      answer => answer.teamId === teamId
    );
  }

  reset() {
    this.users.clear();
    this.teams.clear();
    this.gameSessions.clear();
    this.questions.clear();
    this.playerAnswers.clear();
  }
}

export const db = new InMemoryDB();
