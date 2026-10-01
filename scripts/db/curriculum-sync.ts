import { syncCurriculum } from '@/features/curriculum/sync';
import { expectedEnvironment, openDatabase, runScript } from './connect';

void runScript(async () => {
  const environment = expectedEnvironment();
  const { db, close } = await openDatabase(environment);
  try {
    const summary = await syncCurriculum(db);
    console.info(`Curriculum synced to the ${environment} branch: ${summary.units} units, ${summary.lessons} lessons.`);
  } finally {
    await close();
  }
});
