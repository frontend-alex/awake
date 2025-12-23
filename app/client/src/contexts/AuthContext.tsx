import type { User } from "@shared/types/user";
import type { ApiError } from "@shared/types/api";

import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "@/hooks/hook";
import { createContext, useCallback, useContext, useMemo, useEffect } from "react";
import { API } from "@/config/config";
import { ROUTES, ROUTE_HELPERS } from "@/config/routes";

// Auth cache utilities
const AUTH_CACHE_KEY = "auth_cache";
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

type AuthCache = {
  user: User | null;
  timestamp: number;
  isAuthenticated: boolean;
};

const getAuthCache = (): AuthCache | null => {
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;
    
    const parsed: AuthCache = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid (within duration)
    if (now - parsed.timestamp > AUTH_CACHE_DURATION) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
};

const setAuthCache = (user: User | null, isAuthenticated: boolean) => {
  try {
    const cache: AuthCache = {
      user,
      timestamp: Date.now(),
      isAuthenticated,
    };
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore localStorage errors
  }
};

const clearAuthCache = () => {
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // Ignore localStorage errors
  }
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: ApiError | null;
  isAuthenticated: boolean;
  logout: () => void;
  refetch: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get cached auth state - re-check when location changes
  const cachedAuth = useMemo(() => getAuthCache(), [location.pathname]);
  
  // Only query if we're on a protected route OR if cache is stale/missing
  const isProtectedRoute = ROUTE_HELPERS.isAuthenticatedRoute(location.pathname);
  const shouldQuery = isProtectedRoute || !cachedAuth;

  const { data, isLoading, error, refetch } = useApiQuery<{ user: User }>(
    ["auth", "me"],
    API.USER.GET_ME,
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 15, // 15 minutes
      enabled: shouldQuery,
    }
  );

  // Update cache when auth data changes
  useEffect(() => {
    if (data?.data?.user) {
      setAuthCache(data.data.user, true);
    } else if (error && !isLoading && shouldQuery) {
      // Only clear cache if we got an error and we're not loading
      // This means the auth check failed
      setAuthCache(null, false);
    }
  }, [data, error, isLoading, shouldQuery]);

  const { mutateAsync: logoutMutation } = useApiMutation(
    "POST",
    API.AUTH.PRIVATE.LOGOUT,
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.setQueryData(["auth", "me"], null);
        clearAuthCache();
        navigate(ROUTES.PUBLIC.LANDING, { replace: true });
      },
    }
  );

  const logout = useCallback(async () => {
    await logoutMutation(undefined);
  }, [logoutMutation]);

  const contextValue = useMemo<AuthContextType>(() => {
    // Use cached data if query is disabled and we have cache
    // Otherwise use the query data
    const user = shouldQuery 
      ? (data?.data?.user ?? null)
      : (cachedAuth?.user ?? null);
    
    const isAuthenticated = shouldQuery 
      ? Boolean(data?.data?.user) && !error
      : (cachedAuth?.isAuthenticated ?? false);
    
    // If query is disabled, we're not loading (we're using cache)
    const actualIsLoading = shouldQuery ? isLoading : false;
    
    return {
      user,
      isLoading: actualIsLoading,
      error: shouldQuery ? error : null,
      isAuthenticated,
      logout,
      refetch,
    };
  }, [data, isLoading, error, refetch, logout, cachedAuth, shouldQuery]);

  return (
      <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
};
