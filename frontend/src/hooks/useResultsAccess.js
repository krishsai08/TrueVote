import { useState, useEffect } from 'react';
import api from '../api/client';

export function useResultsAccess(electionId) {
  const [canAccess, setCanAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!electionId) {
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        const { data } = await api.get(`/elections/${electionId}/results/status`);
        setCanAccess(data.resultsReleased);
        setError(null);
      } catch (err) {
        if (err.response?.status === 403) {
          setCanAccess(false);
          setError('Results not yet released by administrator');
        } else if (err.response?.status === 404) {
          setError('Election not found');
        } else {
          setError('Error checking results access');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [electionId]);

  return { canAccess, loading, error };
}
