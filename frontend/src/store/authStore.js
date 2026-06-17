import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (userData, token) => {
        localStorage.removeItem('mykonos-auth');
        set({
          user: userData,
          token,
          isAuthenticated: true
        });
      },
      
      logout: () => {
        localStorage.removeItem('mykonos-auth');
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },
      
      updateUser: (userData) => {
        set({ user: userData });
      }
    }),
    {
      name: 'mykonos-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
