import { Sequelize, SyncOptions } from "sequelize";

export default class Database {
  private static sequelize: Sequelize | null = null;

  public static getDb(): Sequelize {
    if (this.sequelize === null) {
      this.sequelize = new Sequelize(
        process.env.DB_NAME as string,
        process.env.DB_USERNAME as string,
        process.env.DB_PASSWORD as string,
        {
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT as string) ? 3306 : parseInt(process.env.DB_PORT as string),
          dialect: 'mysql',
          logging: console.log
        });
    }

    return this.sequelize;
  }

  public static sync(option?: SyncOptions) {
    return this.getDb().sync(option);
  }
}