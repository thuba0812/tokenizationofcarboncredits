import { useCallback, useEffect, useState } from 'react';
import type { ProjectVintageWithDetails } from '../repositories/ProjectVintageRepository';
import { projectVintageRepository } from '../repositories/ProjectVintageRepository';

export function useProjectVintages() {
  const [projectVintages, setProjectVintages] = useState<ProjectVintageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectVintageRepository.getAllWithDetails();
      setProjectVintages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { projectVintages, loading, reload };
}

export function useProjectVintage(id: string | null) {
  const [projectVintage, setProjectVintage] = useState<ProjectVintageWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjectVintage() {
      setLoading(true);
      try {
        if (!id) {
          setProjectVintage(null);
          return;
        }
        const data = await projectVintageRepository.getByIdWithDetails(id);
        setProjectVintage(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectVintage();
  }, [id]);

  return { projectVintage, loading };
}
