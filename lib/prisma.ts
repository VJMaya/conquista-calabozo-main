// lib/prisma.ts
// Versión simplificada sin base de datos - data en memoria

interface User {
  id: string;
  displayName: string;
  avatarKey: string;
  roleClass: string;
  socketId?: string;
  isConnected: boolean;
}

interface Team {
  id: string;
  name: string;
  currentStage: number;
  totalCorrect: number;
  totalTimeSeconds: number;
  finalScore: number;
  members: string[]; // userIds
}

interface Question {
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
}

interface GameSession {
  id: string;
  name: string;
  status: string;
  maxPlayers: number;
  minPlayers: number;
}

// Base de datos en memoria
class InMemoryDB {
  private users: Map<string, User> = new Map();
  private teams: Map<string, Team> = new Map();
  private gameSessions: Map<string, GameSession> = new Map();
  private questions: Map<string, Question> = new Map();

  // Users
  async createUser(data: Partial<User>) {
    const id = Math.random().toString(36).substr(2, 9);
    const user = { ...data, id, isConnected: true } as User;
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
    if (user) {
      const updated = { ...user, ...data };
      this.users.set(id, updated);
      return updated;
    }
    return null;
  }

  async deleteUser(id: string) {
    this.users.delete(id);
  }

  // Teams
  async createTeam(data: Partial<Team>) {
    const id = Math.random().toString(36).substr(2, 9);
    const team = { ...data, id, members: [] } as Team;
    this.teams.set(id, team);
    return team;
  }

  async getTeamsBySession(sessionId: string) {
    return Array.from(this.teams.values());
  }

  async updateTeam(id: string, data: Partial<Team>) {
    const team = this.teams.get(id);
    if (team) {
      const updated = { ...team, ...data };
      this.teams.set(id, updated);
      return updated;
    }
    return null;
  }

  // Questions
  async addQuestion(data: Partial<Question>) {
    const id = Math.random().toString(36).substr(2, 9);
    const question = { ...data, id } as Question;
    this.questions.set(id, question);
    return question;
  }

  async getQuestionsByStage(stageId: string) {
    return Array.from(this.questions.values()).filter(q => q.stageId === stageId);
async updateQuestion(id: string, data: Partial<Question>) {
  const question = this.questions.get(id);

  if (!question) {
    return null;
  }

  const updated = { ...question, ...data };

  this.questions.set(id, updated);

  return updated;
}

async deleteQuestion(id: string) {
  return this.questions.delete(id);
}

  }

  // Reset
  reset() {
    this.users.clear();
    this.teams.clear();
    this.gameSessions.clear();
    this.questions.clear();
  }
}

export const db = new InMemoryDB();
