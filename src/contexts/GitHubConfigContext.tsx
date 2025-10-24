import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GitHubConfig } from '../types';
import { storageService } from '../services/storageService';
import { TokenStore } from '../utils/tokenStore';

interface GitHubConfigContextType {
  config: GitHubConfig | null;
  setConfig: (config: GitHubConfig | null) => void;
  clearConfig: () => void;
  isLoading: boolean;
}

const GitHubConfigContext = createContext<GitHubConfigContextType | undefined>(undefined);

interface GitHubConfigProviderProps {
  children: ReactNode;
}

export const GitHubConfigProvider: React.FC<GitHubConfigProviderProps> = ({ children }) => {
  const [config, setConfigState] = useState<GitHubConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const savedConfig = await storageService.getGitHubConfig();
      const tokenData = TokenStore.get();
      
      if (savedConfig && tokenData) {
        setConfigState({
          ...savedConfig,
          token: tokenData.token,
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setConfig = (newConfig: GitHubConfig | null) => {
    setConfigState(newConfig);
    if (newConfig) {
      TokenStore.set({
        token: newConfig.token,
        owner: newConfig.owner,
        repo: newConfig.repo,
        folderPath: newConfig.folderPath,
        branch: newConfig.branch,
      });
    } else {
      TokenStore.clear();
    }
  };

  const clearConfig = () => {
    setConfigState(null);
    TokenStore.clear();
  };

  return (
    <GitHubConfigContext.Provider value={{ config, setConfig, clearConfig, isLoading }}>
      {children}
    </GitHubConfigContext.Provider>
  );
};

export const useGitHubConfig = (): GitHubConfigContextType => {
  const context = useContext(GitHubConfigContext);
  if (context === undefined) {
    throw new Error('useGitHubConfig must be used within a GitHubConfigProvider');
  }
  return context;
};
