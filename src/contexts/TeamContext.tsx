"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { supabase } from "../utils/supabase"
import { useAuth } from "./AuthContext"
import { v4 as uuidv4 } from "uuid"

interface Team {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
}

interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: string
  created_at: string
  updated_at: string
}

interface TeamContextType {
  teams: Team[]
  currentTeam: Team | null
  isLoading: boolean
  createTeam: (name: string) => Promise<Team>
  switchTeam: (teamId: string) => Promise<void>
  updateTeam: (teamId: string, data: { name: string }) => Promise<void>
  inviteTeamMember: (teamId: string, email: string, role: string) => Promise<void>
  removeTeamMember: (teamId: string, userId: string) => Promise<void>
  leaveTeam: (teamId: string) => Promise<void>
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadTeams()
    } else {
      setTeams([])
      setCurrentTeam(null)
      setIsLoading(false)
    }
  }, [user])

  const loadTeams = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Get teams where user is owner
      const { data: ownedTeams, error: ownedError } = await supabase.from("teams").select("*").eq("owner_id", user.id)

      if (ownedError) throw ownedError

      // Get teams where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", user.id)

      if (memberError) throw memberError

      // Get team details for memberships
      let memberTeams: Team[] = []
      if (memberships.length > 0) {
        const { data: teams, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .in(
            "id",
            memberships.map((m) => m.team_id),
          )

        if (teamsError) throw teamsError
        memberTeams = teams || []
      }

      // Combine owned and member teams
      const allTeams = [...(ownedTeams || []), ...memberTeams]
      setTeams(allTeams)

      // Load last selected team or default to first team
      const lastTeamId = await AsyncStorage.getItem("current-team-id")
      const selectedTeam = lastTeamId ? allTeams.find((t) => t.id === lastTeamId) : allTeams[0] || null

      setCurrentTeam(selectedTeam)
    } catch (error) {
      console.error("Error loading teams:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createTeam = async (name: string): Promise<Team> => {
    if (!user) throw new Error("User not authenticated")

    const teamId = uuidv4()
    const now = new Date().toISOString()

    const newTeam: Team = {
      id: teamId,
      name,
      owner_id: user.id,
      created_at: now,
      updated_at: now,
    }

    const { error } = await supabase.from("teams").insert(newTeam)

    if (error) throw error

    setTeams((prev) => [...prev, newTeam])
    setCurrentTeam(newTeam)
    await AsyncStorage.setItem("current-team-id", teamId)

    return newTeam
  }

  const switchTeam = async (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (!team) throw new Error("Team not found")

    setCurrentTeam(team)
    await AsyncStorage.setItem("current-team-id", teamId)
  }

  const updateTeam = async (teamId: string, data: { name: string }) => {
    if (!user) throw new Error("User not authenticated")

    const team = teams.find((t) => t.id === teamId)
    if (!team) throw new Error("Team not found")

    // Check if user is owner
    if (team.owner_id !== user.id) {
      throw new Error("Only team owner can update team")
    }

    const { error } = await supabase
      .from("teams")
      .update({
        name: data.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId)

    if (error) throw error

    // Update local state
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, name: data.name } : t)))

    if (currentTeam?.id === teamId) {
      setCurrentTeam((prev) => (prev ? { ...prev, name: data.name } : null))
    }
  }

  const inviteTeamMember = async (teamId: string, email: string, role: string) => {
    if (!user) throw new Error("User not authenticated")

    const team = teams.find((t) => t.id === teamId)
    if (!team) throw new Error("Team not found")

    // Check if user is owner or admin
    if (team.owner_id !== user.id) {
      // Check if user is admin
      const { data: membership, error: memberError } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single()

      if (memberError || membership?.role !== "admin") {
        throw new Error("Only team owner or admin can invite members")
      }
    }

    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (userError) {
      throw new Error("User not found")
    }

    // Check if already a member
    const { data: existingMember, error: memberError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", existingUser.id)

    if (!memberError && existingMember && existingMember.length > 0) {
      throw new Error("User is already a team member")
    }

    // Add team member
    const { error } = await supabase.from("team_members").insert({
      id: uuidv4(),
      team_id: teamId,
      user_id: existingUser.id,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) throw error
  }

  const removeTeamMember = async (teamId: string, userId: string) => {
    if (!user) throw new Error("User not authenticated")

    const team = teams.find((t) => t.id === teamId)
    if (!team) throw new Error("Team not found")

    // Check if user is owner
    if (team.owner_id !== user.id && user.id !== userId) {
      throw new Error("Only team owner can remove members")
    }

    const { error } = await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", userId)

    if (error) throw error
  }

  const leaveTeam = async (teamId: string) => {
    if (!user) throw new Error("User not authenticated")

    const team = teams.find((t) => t.id === teamId)
    if (!team) throw new Error("Team not found")

    // Check if user is owner
    if (team.owner_id === user.id) {
      throw new Error("Team owner cannot leave team")
    }

    const { error } = await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", user.id)

    if (error) throw error

    // Update local state
    setTeams((prev) => prev.filter((t) => t.id !== teamId))

    if (currentTeam?.id === teamId) {
      const newCurrentTeam = teams.find((t) => t.id !== teamId) || null
      setCurrentTeam(newCurrentTeam)

      if (newCurrentTeam) {
        await AsyncStorage.setItem("current-team-id", newCurrentTeam.id)
      } else {
        await AsyncStorage.removeItem("current-team-id")
      }
    }
  }

  const value = {
    teams,
    currentTeam,
    isLoading,
    createTeam,
    switchTeam,
    updateTeam,
    inviteTeamMember,
    removeTeamMember,
    leaveTeam,
  }

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeam() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider")
  }
  return context
}
