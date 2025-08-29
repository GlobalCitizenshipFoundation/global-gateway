"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineTab } from "./tabs/TimelineTab";
import { ApplicationsTab } from "./tabs/ApplicationsTab";
import { ActivitiesTab } from "./tabs/ActivitiesTab";
import { MessagesTab } from "./tabs/MessagesTab";
import { SettingsTab } from "./tabs/SettingsTab"; // Import the new SettingsTab

export function ProfileTabs() {
  return (
    <Tabs defaultValue="timeline" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto rounded-xl shadow-md bg-card text-card-foreground border-border p-1">
        <TabsTrigger value="timeline" className="text-label-large data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg">
          Timeline
        </TabsTrigger>
        <TabsTrigger value="applications" className="text-label-large data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg">
          Applications
        </TabsTrigger>
        <TabsTrigger value="activities" className="text-label-large data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg">
          Activities
        </TabsTrigger>
        <TabsTrigger value="messages" className="text-label-large data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg">
          Messages
        </TabsTrigger>
        <TabsTrigger value="settings" className="text-label-large data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg">
          Settings
        </TabsTrigger>
      </TabsList>
      <div className="mt-6">
        <TabsContent value="timeline">
          <TimelineTab />
        </TabsContent>
        <TabsContent value="applications">
          <ApplicationsTab />
        </TabsContent>
        <TabsContent value="activities">
          <ActivitiesTab />
        </TabsContent>
        <TabsContent value="messages">
          <MessagesTab />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </div>
    </Tabs>
  );
}