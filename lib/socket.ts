"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL 

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    // Only attempt connection in browser environment
    if (typeof window === "undefined") return

    let socketInstance: Socket | null = null

    try {
      socketInstance = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        autoConnect: false, // Don't auto-connect, we'll connect manually
      })

      // Manual connection with error handling
      const connectSocket = () => {
        if (socketInstance && !socketInstance.connected) {
          socketInstance.connect()
        }
      }

      socketInstance.on("connect", () => {
        console.log("Connected to socket server:", socketInstance?.id)
        setIsConnected(true)
        setConnectionError(null)
      })

      socketInstance.on("disconnect", (reason) => {
        console.log("Disconnected from socket server:", reason)
        setIsConnected(false)
      })

      socketInstance.on("connect_error", (error) => {
        console.warn("Socket connection failed:", error.message)
        setConnectionError(error.message)
        setIsConnected(false)

        // Don't throw error, just log it
        // This prevents the app from crashing when socket server is unavailable
      })

      socketInstance.on("reconnect", (attemptNumber) => {
        console.log("Socket reconnected after", attemptNumber, "attempts")
        setIsConnected(true)
        setConnectionError(null)
      })

      socketInstance.on("reconnect_error", (error) => {
        console.warn("Socket reconnection failed:", error.message)
        setConnectionError(error.message)
      })

      socketInstance.on("reconnect_failed", () => {
        console.warn("Socket reconnection failed after all attempts")
        setConnectionError("Failed to reconnect after multiple attempts")
      })

      setSocket(socketInstance)

      // Attempt initial connection with delay to ensure component is mounted
      const connectTimer = setTimeout(connectSocket, 100)

      return () => {
        clearTimeout(connectTimer)
        if (socketInstance) {
          socketInstance.disconnect()
          socketInstance.removeAllListeners()
        }
      }
    } catch (error) {
      console.warn("Failed to initialize socket:", error)
      setConnectionError("Failed to initialize socket connection")
    }
  }, [])

  return { socket, isConnected, connectionError }
}
