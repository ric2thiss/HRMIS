# State Management

## 📋 Overview

The DICT Project uses a hybrid state management approach combining **Zustand** for client state and **TanStack Query (React Query)** for server state, providing an optimal balance between simplicity and power.

## 🎯 State Classification

### 1. **Server State** (React Query)
Data that originates from the backend:
- User lists
- Attendance records
- Leave applications
- Master list data
- PDS information

### 2. **Client State** (Zustand)
Data that lives only on the client:
- Authentication status
- User preferences
- UI state (modals, sidebars)
- Form data (complex multi-step forms)
- Notifications

### 3. **Local State** (useState)
Component-specific temporary data:
- Form inputs
- Toggle states
- Local UI interactions

## 🔄 React Query (Server State)

### Setup

```javascript
// src/config/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

```javascript
// src/main.jsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

### Basic Usage

**Fetching Data (Query):**

```javascript
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/api/user/userApi';

function UserList() {
  const { 
    data, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

**Mutating Data (Mutation):**

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser } from '@/api/user/userApi';

function CreateUserForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Invalidate and refetch users query
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleSubmit = (userData) => {
    mutation.mutate(userData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={mutation.isLoading}
      >
        {mutation.isLoading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Advanced Patterns

**Query with Parameters:**

```javascript
const { data } = useQuery({
  queryKey: ['user', userId], // Cache key includes parameter
  queryFn: () => getUser(userId),
  enabled: !!userId, // Only run if userId exists
});
```

**Paginated Queries:**

```javascript
const [page, setPage] = useState(1);

const { data, isPreviousData } = useQuery({
  queryKey: ['users', page],
  queryFn: () => getUsers({ page }),
  keepPreviousData: true, // Keep old data while fetching new
});
```

**Infinite Queries:**

```javascript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['users'],
  queryFn: ({ pageParam = 1 }) => getUsers({ page: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
});
```

**Optimistic Updates:**

```javascript
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUser) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['users', newUser.id] });

    // Snapshot previous value
    const previousUser = queryClient.getQueryData(['users', newUser.id]);

    // Optimistically update
    queryClient.setQueryData(['users', newUser.id], newUser);

    // Return context with snapshotted value
    return { previousUser };
  },
  onError: (err, newUser, context) => {
    // Rollback on error
    queryClient.setQueryData(
      ['users', newUser.id],
      context.previousUser
    );
  },
  onSettled: (newUser) => {
    // Refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['users', newUser.id] });
  },
});
```

**Dependent Queries:**

```javascript
// Get user first
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => getUser(userId),
});

// Then get user's office (depends on user)
const { data: office } = useQuery({
  queryKey: ['office', user?.office_id],
  queryFn: () => getOffice(user.office_id),
  enabled: !!user?.office_id, // Only run when user is loaded
});
```

**Prefetching:**

```javascript
import { useQueryClient } from '@tanstack/react-query';

function UserListItem({ userId }) {
  const queryClient = useQueryClient();

  const prefetchUser = () => {
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => getUser(userId),
    });
  };

  return (
    <div onMouseEnter={prefetchUser}>
      User {userId}
    </div>
  );
}
```

## 🗃️ Zustand (Client State)

### Setup

**Creating a Store:**

```javascript
// src/stores/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,

      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: true 
      }),

      setToken: (token) => set({ token }),

      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),

      // Computed values (getters)
      getUserRole: () => get().user?.role,

      hasPermission: (permission) => {
        const user = get().user;
        return user?.permissions?.includes(permission);
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
      }), // Only persist these fields
    }
  )
);
```

### Basic Usage

```javascript
import { useAuthStore } from '@/stores/authStore';

function UserProfile() {
  // Select only what you need (prevents unnecessary re-renders)
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Common Store Patterns

**Notification Store:**

```javascript
// src/stores/notificationStore.js
import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      { id: Date.now(), ...notification }
    ]
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  clearNotifications: () => set({ notifications: [] }),
}));

// Usage
const { addNotification } = useNotificationStore();

addNotification({
  type: 'success',
  message: 'User created successfully!',
  duration: 3000,
});
```

**UI State Store:**

```javascript
// src/stores/uiStore.js
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isSidebarOpen: true,
  isModalOpen: false,
  modalContent: null,

  toggleSidebar: () => set((state) => ({ 
    isSidebarOpen: !state.isSidebarOpen 
  })),

  openModal: (content) => set({ 
    isModalOpen: true, 
    modalContent: content 
  }),

  closeModal: () => set({ 
    isModalOpen: false, 
    modalContent: null 
  }),
}));
```

**Form Store (Multi-step forms):**

```javascript
// src/stores/pdsStore.js
import { create } from 'zustand';

export const usePDSStore = create((set) => ({
  currentStep: 0,
  formData: {
    personalInfo: {},
    familyBackground: {},
    education: [],
    workExperience: [],
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  updateFormData: (section, data) => set((state) => ({
    formData: {
      ...state.formData,
      [section]: data,
    },
  })),

  resetForm: () => set({
    currentStep: 0,
    formData: {
      personalInfo: {},
      familyBackground: {},
      education: [],
      workExperience: [],
    },
  }),
}));
```

### Advanced Zustand Patterns

**Slices Pattern:**

```javascript
// src/stores/createAuthSlice.js
export const createAuthSlice = (set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
});

// src/stores/createUISlice.js
export const createUISlice = (set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
});

// src/stores/index.js
import { create } from 'zustand';
import { createAuthSlice } from './createAuthSlice';
import { createUISlice } from './createUISlice';

export const useStore = create((...a) => ({
  ...createAuthSlice(...a),
  ...createUISlice(...a),
}));
```

**Async Actions:**

```javascript
export const useUserStore = create((set, get) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const users = await api.get('/users');
      set({ users: users.data, loading: false });
    } catch (error) {
      set({ loading: false });
      // Handle error
    }
  },
}));
```

## 🎨 Custom Hooks

Encapsulate complex logic in custom hooks:

```javascript
// src/hooks/useAuth.js
import { useAuthStore } from '@/stores/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login as loginApi, logout as logoutApi } from '@/api/auth/authApi';

export function useAuth() {
  const queryClient = useQueryClient();
  const { setUser, logout: logoutStore } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      logoutStore();
      queryClient.clear();
    },
  });

  return {
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isLoading,
  };
}
```

**Using the custom hook:**

```javascript
function LoginForm() {
  const { login, isLoggingIn } = useAuth();

  const handleSubmit = (credentials) => {
    login(credentials);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={isLoggingIn}>
        {isLoggingIn ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## 📦 State Structure Examples

### Store Organization

```
src/stores/
├── authStore.js              # Authentication state
├── attendanceStore.js        # Attendance module state
├── leaveStore.js             # Leave management state
├── pdsStore.js               # PDS form state
├── notificationStore.js      # Notifications
├── uiStore.js                # UI state (modals, sidebars)
└── masterListsStore.js       # Master lists cache
```

### Query Key Organization

```javascript
// Query keys should be hierarchical
const queryKeys = {
  users: ['users'],
  userDetail: (id) => ['users', id],
  userAttendance: (id) => ['users', id, 'attendance'],

  attendance: ['attendance'],
  attendanceByDate: (date) => ['attendance', { date }],

  leave: ['leave'],
  leaveApplications: ['leave', 'applications'],
  leaveApplication: (id) => ['leave', 'applications', id],
  leaveTypes: ['leave', 'types'],
  leaveCredits: (userId) => ['leave', 'credits', userId],
};
```

## 🔄 State Synchronization

### Syncing React Query with Zustand

```javascript
// Update Zustand when React Query data changes
const { data: user } = useQuery({
  queryKey: ['user'],
  queryFn: getUser,
  onSuccess: (data) => {
    useAuthStore.getState().setUser(data);
  },
});
```

### Real-time Updates

```javascript
// Polling for real-time data
const { data } = useQuery({
  queryKey: ['notifications'],
  queryFn: getNotifications,
  refetchInterval: 30000, // Refetch every 30 seconds
});

// Manual refetch on event
const queryClient = useQueryClient();

const handleNewNotification = () => {
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
};
```

## ⚡ Performance Optimization

### Prevent Unnecessary Re-renders

**Zustand selector:**
```javascript
// ❌ Bad: Re-renders on any state change
const state = useAuthStore();

// ✅ Good: Re-renders only when user changes
const user = useAuthStore((state) => state.user);
```

**React Query select:**
```javascript
const { data: userName } = useQuery({
  queryKey: ['user'],
  queryFn: getUser,
  select: (data) => data.name, // Only return what you need
});
```

### Debouncing Updates

```javascript
import { useMutation } from '@tanstack/react-query';
import { debounce } from 'lodash';

const updateMutation = useMutation({
  mutationFn: updateData,
});

const debouncedUpdate = debounce((data) => {
  updateMutation.mutate(data);
}, 500);
```

## 🧪 Testing State

**Testing Zustand:**
```javascript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';

test('should login user', () => {
  const { result } = renderHook(() => useAuthStore());

  act(() => {
    result.current.setUser({ id: 1, name: 'John' });
  });

  expect(result.current.user).toEqual({ id: 1, name: 'John' });
  expect(result.current.isAuthenticated).toBe(true);
});
```

**Testing React Query:**
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('should fetch users', async () => {
  const { result } = renderHook(
    () => useQuery({ queryKey: ['users'], queryFn: getUsers }),
    { wrapper: createWrapper() }
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

## 📚 Best Practices

1. **Use React Query for server state** - Don't duplicate server data in Zustand
2. **Keep Zustand stores focused** - One store per domain
3. **Use selectors** - Prevent unnecessary re-renders
4. **Normalize data** - Avoid nested data structures
5. **Invalidate queries** - After mutations that change data
6. **Use query keys wisely** - Hierarchical and descriptive
7. **Persist only necessary data** - Don't persist everything
8. **Clean up** - Remove query cache when appropriate

## 📞 Further Reading

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)

---

*Effective state management ensures predictable, performant, and maintainable applications.*

