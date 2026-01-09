import { ComparisonSession, Option, Criterion, AnalysisResult } from '../types/core';

// Simple UUID v4 generator to avoid module import issues in tests
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface SessionStorage {
  save(session: ComparisonSession): Promise<void>;
  load(sessionId: string): Promise<ComparisonSession | null>;
  list(): Promise<ComparisonSession[]>;
  delete(sessionId: string): Promise<void>;
  exists(sessionId: string): Promise<boolean>;
}

/**
 * In-memory session storage implementation
 * For production, this would be replaced with database storage
 */
class InMemorySessionStorage implements SessionStorage {
  private sessions: Map<string, ComparisonSession> = new Map();

  async save(session: ComparisonSession): Promise<void> {
    this.sessions.set(session.id, { ...session, updatedAt: new Date() });
  }

  async load(sessionId: string): Promise<ComparisonSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async list(): Promise<ComparisonSession[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async exists(sessionId: string): Promise<boolean> {
    return this.sessions.has(sessionId);
  }
}

/**
 * SessionManager handles comparison session lifecycle and persistence
 * Requirements: All requirements (session management and data persistence)
 */
export class SessionManager {
  private storage: SessionStorage;

  constructor(storage?: SessionStorage) {
    this.storage = storage || new InMemorySessionStorage();
  }

  /**
   * Creates a new comparison session
   */
  async createSession(
    name: string, 
    description?: string, 
    options: Option[] = [], 
    criteria: Criterion[] = []
  ): Promise<ComparisonSession> {
    const session: ComparisonSession = {
      id: generateUUID(),
      name,
      description,
      options,
      criteria,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.save(session);
    return session;
  }

  /**
   * Loads an existing session by ID
   */
  async loadSession(sessionId: string): Promise<ComparisonSession | null> {
    return this.storage.load(sessionId);
  }

  /**
   * Updates an existing session
   */
  async updateSession(sessionId: string, updates: Partial<ComparisonSession>): Promise<ComparisonSession> {
    const existingSession = await this.storage.load(sessionId);
    if (!existingSession) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedSession: ComparisonSession = {
      ...existingSession,
      ...updates,
      id: sessionId, // Ensure ID cannot be changed
      updatedAt: new Date()
    };

    await this.storage.save(updatedSession);
    return updatedSession;
  }

  /**
   * Adds options to a session
   */
  async addOptionsToSession(sessionId: string, options: Option[]): Promise<ComparisonSession> {
    const session = await this.storage.load(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedOptions = [...session.options];
    options.forEach(option => {
      const existingIndex = updatedOptions.findIndex(opt => opt.id === option.id);
      if (existingIndex >= 0) {
        updatedOptions[existingIndex] = option;
      } else {
        updatedOptions.push(option);
      }
    });

    return this.updateSession(sessionId, { options: updatedOptions });
  }

  /**
   * Removes options from a session
   */
  async removeOptionsFromSession(sessionId: string, optionIds: string[]): Promise<ComparisonSession> {
    const session = await this.storage.load(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedOptions = session.options.filter(option => !optionIds.includes(option.id));
    return this.updateSession(sessionId, { options: updatedOptions });
  }

  /**
   * Adds criteria to a session
   */
  async addCriteriaToSession(sessionId: string, criteria: Criterion[]): Promise<ComparisonSession> {
    const session = await this.storage.load(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedCriteria = [...session.criteria];
    criteria.forEach(criterion => {
      const existingIndex = updatedCriteria.findIndex(crit => crit.id === criterion.id);
      if (existingIndex >= 0) {
        updatedCriteria[existingIndex] = criterion;
      } else {
        updatedCriteria.push(criterion);
      }
    });

    return this.updateSession(sessionId, { criteria: updatedCriteria });
  }

  /**
   * Removes criteria from a session
   */
  async removeCriteriaFromSession(sessionId: string, criteriaIds: string[]): Promise<ComparisonSession> {
    const session = await this.storage.load(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const updatedCriteria = session.criteria.filter(criterion => !criteriaIds.includes(criterion.id));
    return this.updateSession(sessionId, { criteria: updatedCriteria });
  }

  /**
   * Stores analysis results with a session
   */
  async saveAnalysisResults(sessionId: string, analysis: AnalysisResult): Promise<ComparisonSession> {
    return this.updateSession(sessionId, { analysis });
  }

  /**
   * Lists all sessions
   */
  async listSessions(): Promise<ComparisonSession[]> {
    return this.storage.list();
  }

  /**
   * Deletes a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const exists = await this.storage.exists(sessionId);
    if (!exists) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    await this.storage.delete(sessionId);
  }

  /**
   * Checks if a session exists
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    return this.storage.exists(sessionId);
  }

  /**
   * Duplicates an existing session with a new name
   */
  async duplicateSession(sessionId: string, newName: string): Promise<ComparisonSession> {
    const originalSession = await this.storage.load(sessionId);
    if (!originalSession) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const duplicatedSession: ComparisonSession = {
      ...originalSession,
      id: generateUUID(),
      name: newName,
      createdAt: new Date(),
      updatedAt: new Date(),
      analysis: undefined // Clear analysis results for new session
    };

    await this.storage.save(duplicatedSession);
    return duplicatedSession;
  }
}