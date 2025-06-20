"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Calendar, Tag, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { createApiRequest } from "@/lib/api-client"
import { useSocket } from "@/lib/socket"

interface Disaster {
  id: string
  title: string
  description: string
  tags: string[]
  location?: string
  locationName?: string
  createdAt: string
  updatedAt: string
}

export default function HomePage() {
  const [disasters, setDisasters] = useState<Disaster[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    locationName: "",
    locationDescription: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "fallback">("checking")

  const { socket, isConnected, connectionError } = useSocket()

  useEffect(() => {
    fetchDisasters()
  }, [])

  useEffect(() => {
    if (socket && isConnected) {
      socket.on("disaster_updated", (data) => {
        console.log("Disaster updated:", data)
        fetchDisasters()
      })

      return () => {
        socket.off("disaster_updated")
      }
    }
  }, [socket, isConnected])

  const fetchDisasters = async () => {
    try {
      setApiStatus("checking")
      const response = await createApiRequest.getDisasters()
      setDisasters(response.data)
      setApiStatus("connected")
    } catch (error) {
      console.error("Error fetching disasters:", error)
      setApiStatus("fallback")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDisaster = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        location_name: formData.locationName || "",
        latitude: 0,
        longitude: 0,
        ...(formData.locationDescription ? { locationDescription: formData.locationDescription } : {}),
      }

      await createApiRequest.createDisaster(payload)

      // Reset form
      setFormData({
        title: "",
        description: "",
        tags: "",
        locationName: "",
        locationDescription: "",
      })
      setShowCreateForm(false)

      // Show success message
      console.log("✅ Disaster created successfully!")

      // Refresh the disasters list
      fetchDisasters()
    } catch (error) {
      console.error("❌ Error creating disaster:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading disasters...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Disaster Management Dashboard</h1>

          {/* API Status Indicator */}
          <div className="flex items-center gap-4 mt-2">
            {apiStatus === "connected" && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                {/* <span className="text-sm">Connected to API Server</span> */}
              </div>
            )}

            {apiStatus === "fallback" && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Using Demo Data (API Unavailable)</span>
              </div>
            )}

            {connectionError && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                {/* <span className="text-sm">Real-time updates unavailable</span> */}
              </div>
            )}

            {isConnected && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Real-time connected</span>
              </div>
            )}
          </div>

          <p className="text-muted-foreground mt-2">Monitor and manage disaster responses</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Disaster
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Disaster</CardTitle>
            <CardDescription>Add a new disaster to the management system (User: reliefAdmin)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDisaster} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="earthquake, emergency, rescue"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="locationName">Location Name</Label>
                  <Input
                    id="locationName"
                    value={formData.locationName}
                    onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                    placeholder="City, State, Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationDescription">Location Description</Label>
                  <Input
                    id="locationDescription"
                    value={formData.locationDescription}
                    onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                    placeholder="Describe the affected area"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Disaster"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disasters.map((disaster) => (
          <Card key={disaster.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{disaster.title}</CardTitle>
                <Badge variant="outline">Active</Badge>
              </div>
              <CardDescription className="line-clamp-2">{disaster.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(disaster.location || disaster.locationName) && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    {disaster.locationName || disaster.location}
                  </div>
                )}

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(disaster.createdAt).toLocaleDateString()}
                </div>

                {Array.isArray(disaster.tags) && disaster.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {disaster.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Link href={`/disaster/${disaster.id}`}>
                  <Button className="w-full mt-4">View Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {disasters.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No disasters found</h3>
          <p className="text-muted-foreground mb-4">Create your first disaster to get started</p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Disaster
          </Button>
        </div>
      )}
    </div>
  )
}
