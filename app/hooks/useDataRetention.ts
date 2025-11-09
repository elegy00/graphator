import { useEffect } from 'react';
import { dataRetention } from '~/services/dataRetention';

export function useDataRetention() {
  useEffect(() => {
    dataRetention.start();

    return () => {
      dataRetention.stop();
    };
  }, []);
}
