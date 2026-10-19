import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllProjects, getProject, projectHref } from "@/data/queries";
import { stripDraftMarker } from "@/data/schema";
import { ProjectDetail } from "@/components/projects/ProjectDetail";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

const inSection = (kind: string) => kind === "work";

export function generateStaticParams() {
  return getAllProjects()
    .filter((p) => inSection(p.kind))
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project || !inSection(project.kind)) return {};
  return {
    title: project.title,
    description: stripDraftMarker(project.summary),
    alternates: { canonical: projectHref(project) },
  };
}

export default async function WorkPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project || !inSection(project.kind)) notFound();
  return <ProjectDetail project={project} />;
}
