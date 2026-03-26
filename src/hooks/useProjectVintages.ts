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
