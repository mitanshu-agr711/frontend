"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Calendar, Users, MessageSquare, FileText, AlertTriangle, User } from "lucide-react"
import Link from "next/link"
import { createApiRequest } from "@/lib/api-client"
import { useSocket } from "@/lib/socket"

interface Disaster {
  id: string
  title: string
  description: string
  tags: string[]
  location_name?: string
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
  owner_id?: string
  audit_trail?: any[]
}

interface SocialMediaPost {
  id: string
  content: string
  platform: string
  author: string
  timestamp: string
  engagement: number
}

interface Resource {
  id: string
  name: string
  type: string
  location: string
  availability: string
  contact: string
}

interface OfficialUpdate {
  id: string
  title: string
  content: string
  timestamp: string
  author: string
  priority: string
}

export default function DisasterDetailPage() {
  const params = useParams()
  const disasterId = params.id as string

  const [disaster, setDisaster] = useState<Disaster | null>(null)
  const [socialPosts, setSocialPosts] = useState<SocialMediaPost[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [officialUpdates, setOfficialUpdates] = useState<OfficialUpdate[]>([])
  const [loading, setLoading] = useState(true)

  // Update form state
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [updateFormData, setUpdateFormData] = useState({
    title: "",
    description: "",
    tags: "",
    location_name: "",
  })

  // Report form state
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportFormData, setReportFormData] = useState({
    content: "",
    imageUrl: "",
  })

  const { socket, isConnected, connectionError } = useSocket()

  useEffect(() => {
    if (disasterId) {
      fetchDisasterDetails()
      fetchSocialMedia()
      fetchResources()
      fetchOfficialUpdates()
    }
  }, [disasterId])

  useEffect(() => {
    if (socket && isConnected && disasterId) {
      socket.on("disaster_updated", (data) => {
        if (data.id === disasterId) {
          fetchDisasterDetails()
        }
      })

      socket.on("social_media_updated", (data) => {
        if (data.disasterId === disasterId) {
          fetchSocialMedia()
        }
      })

      socket.on("resources_updated", (data) => {
        if (data.disasterId === disasterId) {
          fetchResources()
        }
      })

      return () => {
        socket.off("disaster_updated")
        socket.off("social_media_updated")
        socket.off("resources_updated")
      }
    }
  }, [socket, isConnected, disasterId])

  const fetchDisasterDetails = async () => {
    try {
      const response = await createApiRequest.getDisaster(disasterId)
      setDisaster(response.data)
      setUpdateFormData({
        title: response.data.title,
        description: response.data.description,
        tags: response.data.tags?.join(", ") || "",
        location_name: response.data.location_name || "",
      })
    } catch (error) {
      console.error("Error fetching disaster details:", error)
    }
  }

  const fetchSocialMedia = async () => {
    try {
      const response = await createApiRequest.getSocialMedia(disasterId)
      setSocialPosts(response.data)
    } catch (error) {
      console.error("Error fetching social media:", error)
      setSocialPosts([]) // Set empty array on error
    }
  }

  const fetchResources = async () => {
    try {
      // Use disaster coordinates if available, otherwise use default coordinates
      const lat = disaster?.latitude || 40.7128
      const lon = disaster?.longitude || -74.006
      const response = await createApiRequest.getResources(disasterId, lat, lon)
      setResources(response.data)
    } catch (error) {
      console.error("Error fetching resources:", error)
      setResources([]) // Set empty array on error
    }
  }

  const fetchOfficialUpdates = async () => {
    try {
      const [response1, response2] = await Promise.all([
        createApiRequest.getOfficialUpdates(disasterId).catch(() => ({ data: [] })),
        createApiRequest.getOfficialUpdatesNoCache(disasterId).catch(() => ({ data: [] })),
      ])
      // Combine both responses, removing duplicates
      const combined = [...response1.data, ...response2.data]
      const unique = combined.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id))
      setOfficialUpdates(unique)
    } catch (error) {
      console.error("Error fetching official updates:", error)
      setOfficialUpdates([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDisaster = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        title: updateFormData.title,
        description: updateFormData.description,
        tags: updateFormData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        location_name: updateFormData.location_name,
      }

      const response = await createApiRequest.updateDisaster(disasterId, payload)

      setShowUpdateForm(false)
      console.log("✅ Disaster updated successfully!", response.data)
      fetchDisasterDetails()
    } catch (error) {
      console.error("❌ Error updating disaster:", error)
    }
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await createApiRequest.submitReport(disasterId, reportFormData)

      setReportFormData({ content: "", imageUrl: "" })
      setShowReportForm(false)
      console.log("✅ Report submitted successfully!", response.data)
    } catch (error) {
      console.error("❌ Error submitting report:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading disaster details...</div>
        </div>
      </div>
    )
  }

  if (!disaster) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Disaster not found</h3>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{disaster.title}</h1>
          <p className="text-muted-foreground mt-1">{disaster.description}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUpdateForm(!showUpdateForm)}>
            <User className="w-4 h-4 mr-2" />
            Update (netrunnerX)
          </Button>
          <Button variant="outline" onClick={() => setShowReportForm(!showReportForm)}>
            <User className="w-4 h-4 mr-2" />
            Report (reliefAdmin)
          </Button>
        </div>
      </div>

      {/* Disaster Info Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {disaster.location_name && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{disaster.location_name}</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-sm">Created {new Date(disaster.created_at).toLocaleDateString()}</span>
            </div>
            {disaster.tags && disaster.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tags:</span>
                {disaster.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {disaster.latitude && disaster.longitude && (
            <div className="mt-4 text-sm text-muted-foreground">
              Coordinates: {disaster.latitude.toFixed(4)}, {disaster.longitude.toFixed(4)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Form */}
      {showUpdateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Update Disaster</CardTitle>
            <CardDescription>Modify disaster information (User: netrunnerX - Admin Role)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateDisaster} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="update-title">Title</Label>
                  <Input
                    id="update-title"
                    value={updateFormData.title}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-location">Location Name</Label>
                  <Input
                    id="update-location"
                    value={updateFormData.location_name}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, location_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-description">Description</Label>
                <Textarea
                  id="update-description"
                  value={updateFormData.description}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-tags">Tags (comma-separated)</Label>
                <Input
                  id="update-tags"
                  value={updateFormData.tags}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, tags: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Update Disaster</Button>
                <Button type="button" variant="outline" onClick={() => setShowUpdateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Report Form */}
      {showReportForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Report</CardTitle>
            <CardDescription>
              Submit a report with image verification (User: reliefAdmin - Contributor Role)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-content">Report Content</Label>
                <Textarea
                  id="report-content"
                  value={reportFormData.content}
                  onChange={(e) => setReportFormData({ ...reportFormData, content: e.target.value })}
                  rows={4}
                  placeholder="Describe the situation..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-image">Image URL (Required for verification)</Label>
                <Input
                  id="report-image"
                  type="url"
                  value={reportFormData.imageUrl}
                  onChange={(e) => setReportFormData({ ...reportFormData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Submit Report</Button>
                <Button type="button" variant="outline" onClick={() => setShowReportForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabs for different sections */}
      <Tabs defaultValue="social" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="social" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Official Updates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="social" className="space-y-4">
          <div className="grid gap-4">
            {socialPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{post.platform}</Badge>
                      <span className="text-sm font-medium">{post.author}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(post.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm mb-2">{post.content}</p>
                  <div className="text-xs text-muted-foreground">{post.engagement} engagements</div>
                </CardContent>
              </Card>
            ))}
            {socialPosts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No social media posts available</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4">
            {resources.map((resource) => (
              <Card key={resource.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{resource.name}</h4>
                    <Badge variant={resource.availability === "Available" ? "default" : "secondary"}>
                      {resource.availability}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Type: {resource.type}</div>
                    <div>Location: {resource.location}</div>
                    <div>Contact: {resource.contact}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {resources.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No resources available</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <div className="grid gap-4">
            {officialUpdates.map((update) => (
              <Card key={update.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{update.title}</h4>
                    <div className="flex items-center gap-2">
                      {update.priority === "high" && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      <span className="text-xs text-muted-foreground">
                        {new Date(update.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{update.content}</p>
                  <div className="text-xs text-muted-foreground">By {update.author}</div>
                </CardContent>
              </Card>
            ))}
            {officialUpdates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No official updates available</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}