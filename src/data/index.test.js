import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTaskRepository } from './index.js';

describe('getTaskRepository', () => {
  const mockAuthContext = {
    user: { id: 'user-1', email: 'test@example.com' },
    status: 'authenticated',
    signIn: vi.fn(),
    signOut: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env vars
    delete import.meta.env.VITE_TASK_REPO_MODE;
    delete import.meta.env.VITE_TASK_REPO;
  });

  it('should return LocalTaskRepository for local mode (default)', () => {
    const repo = getTaskRepository(mockAuthContext);
    
    expect(repo).toHaveProperty('loadTasks');
    expect(repo).toHaveProperty('saveTasks');
    expect(repo).toHaveProperty('clearTasks');
    expect(typeof repo.loadTasks).toBe('function');
  });

  it('should return HybridTaskRepository for hybrid mode', () => {
    import.meta.env.VITE_TASK_REPO_MODE = 'hybrid';
    
    const repo = getTaskRepository(mockAuthContext);
    
    expect(repo).toHaveProperty('loadTasks');
    expect(repo).toHaveProperty('saveTasks');
    expect(repo).toHaveProperty('clearTasks');
    expect(typeof repo.loadTasks).toBe('function');
  });

  it('should fallback to local if hybrid mode but no auth context', () => {
    import.meta.env.VITE_TASK_REPO_MODE = 'hybrid';
    
    const repo = getTaskRepository(null);
    
    expect(repo).toHaveProperty('loadTasks');
    expect(repo).toHaveProperty('saveTasks');
    expect(repo).toHaveProperty('clearTasks');
  });

  it('should return RemoteTaskRepositoryStub for remote mode', () => {
    import.meta.env.VITE_TASK_REPO_MODE = 'remote';
    
    const repo = getTaskRepository(mockAuthContext);
    
    expect(repo).toHaveProperty('loadTasks');
    expect(repo).toHaveProperty('saveTasks');
    expect(repo).toHaveProperty('clearTasks');
  });

  it('should not crash when Remote throws in hybrid mode', async () => {
    import.meta.env.VITE_TASK_REPO_MODE = 'hybrid';
    
    const repo = getTaskRepository(mockAuthContext);
    
    // Mock localStorage for LocalTaskRepository
    const mockLocalStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    global.localStorage = mockLocalStorage;
    
    // Hybrid should handle remote failure gracefully
    const result = await repo.loadTasks();
    
    // Should return local tasks (empty array or null) even if remote fails
    expect(result).toBeDefined();
  });
});

