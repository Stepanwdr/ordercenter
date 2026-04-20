import {
  Users
} from '../models/index.js';

const models = {
  Users,
};

async function main() {
  for (const i in models) {
    console.log(i);
    await models[i].sync({ alter: true });
  }
  process.exit(0);
}

main().catch(console.error);