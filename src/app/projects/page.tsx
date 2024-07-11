'use client'
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  created_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) return;

    const { data, error } = await supabase
      .from('projects')
      .insert([{ name: newProjectName }])
      .select();

    if (error) {
      console.error('Error creating project:', error);
    } else {
      setNewProjectName('');
      setIsOpen(false);
      fetchProjects();
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Projects</h1>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">Create New Project</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Project name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="mb-4"
          />
          <Button onClick={createProject}>Create</Button>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Link href={`/project/${project.id}`} key={project.id} className="block">
            <div className="border p-4 rounded-lg hover:bg-gray-100 transition-colors">
              <h2 className="text-xl font-semibold">{project.name}</h2>
              <p className="text-sm text-gray-500">
                Created at: {new Date(project.created_at).toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
      
      <Link href="/" className="mt-8 inline-block">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}