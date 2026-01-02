import { DisconnectReturnType } from "wagmi/actions";

/**
 * Shared logout utility function
 * Handles disconnecting wallet and clearing Dynamic Labs session data
 */
export async function handleLogout(
  disconnect: () => DisconnectReturnType,
  dynamicContext?: any
): Promise<void> {
  try {
    // Try to use Dynamic Labs logout if available
    if (dynamicContext && typeof dynamicContext.logout === "function") {
      await dynamicContext.logout();
    }
    
    // Disconnect wagmi wallet
    disconnect();
    
    // Clear Dynamic Labs session storage
    if (typeof window !== "undefined") {
      // Clear all Dynamic Labs related storage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.toLowerCase().includes("dynamic") || key.toLowerCase().includes("wallet"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Also clear sessionStorage
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.toLowerCase().includes("dynamic") || key.toLowerCase().includes("wallet"))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
    
    // Force a full page reload to clear all state
    window.location.href = "/";
  } catch (error) {
    console.error("Error during logout:", error);
    // Still try to disconnect and redirect even if there's an error
    disconnect();
    window.location.href = "/";
  }
}


