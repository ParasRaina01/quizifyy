"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function SignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signIn("google");
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={loginWithGoogle}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Image 
          src="/google.svg" 
          alt="Google" 
          width={20} 
          height={20}
          className="flex-shrink-0" 
        />
      )}
      Continue with Google
    </button>
  );
}
