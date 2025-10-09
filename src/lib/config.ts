export const DATA_MODE = import.meta.env.DATA_MODE || 'mock';

export const isPrismaMode = () => DATA_MODE === 'prisma';
export const isMockMode = () => DATA_MODE === 'mock';










