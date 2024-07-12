"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchHtmlContent } from "@/services/supabaseClientFunctions";
import ProjectEditor from "./ProjectEditor";

export default function Page() {
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const projectId = params.id;

  useEffect(() => {
    if (projectId) {
      fetchProjectHtmlContent();
    }
  }, [projectId]);

  const fetchProjectHtmlContent = async () => {
    setIsLoading(true);
    try {
      const content = await fetchHtmlContent(projectId);
      setHtmlContent(content);
    } catch (error) {
      console.error("Error fetching HTML content:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <ProjectEditor initialHtmlContent={htmlContent} projectId={projectId} />;
}