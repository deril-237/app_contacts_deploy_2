import {
  BelongsToGetAssociationMixin, CreationOptional, DataTypes,
  ForeignKey, HasManyGetAssociationsMixin, InferAttributes, InferCreationAttributes,
  Model, NonAttribute,
  Optional
} from "sequelize";
import * as bcrypt from 'bcrypt';
import Database from "../database";
import { getPath, siteUrl } from "../utils/upload";


/** CREATE MODEL  **/

export class User extends Model<InferAttributes<User, { omit: 'contacts' }>, InferCreationAttributes<User, { omit: 'contacts' }>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare password: string;
  declare roleId: ForeignKey<Role['id']>;
  declare verify: CreationOptional<boolean>;
  declare otpCode: CreationOptional<string>;
  declare dateCreatedOtpCode: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare role?: NonAttribute<Role>;
  declare contacts?: NonAttribute<Contact[]>;
  declare getRole: BelongsToGetAssociationMixin<Role>;
  declare getContacts: HasManyGetAssociationsMixin<Contact>;

  isAdmin() {
    return this.role && this.role.name === 'admin';
  }

  isUser() {
    return this.role && this.role.name === 'admin';
  }
}

export const listRole: { ADMIN: Role | null, USER: Role | null } = { ADMIN: null, USER: null };

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
  declare id: CreationOptional<number>;
  declare name: 'admin' | 'user';
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export class Contact extends Model<InferAttributes<Contact>, InferCreationAttributes<Contact>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: CreationOptional<string>;
  declare phoneNumber: string;
  declare pathPhoto: CreationOptional<string>;
  declare urlPhoto: CreationOptional<string>;
  declare extPhoto: CreationOptional<string | null>;
  declare ownerId: ForeignKey<User['id']>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'role_id',
    },
    otpCode: {
      type: DataTypes.STRING(16),
      field: 'otp_code',
      allowNull: true,
      defaultValue: null,
    },
    dateCreatedOtpCode: {
      type: DataTypes.DATE,
      field: 'date_created_otp_code',
      allowNull: true,
      defaultValue: null
    },
    verify: {
      type: DataTypes.BOOLEAN,
      field: 'verify',
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    }
  }, {
  sequelize: Database.getDb(),
  modelName: 'User',
  tableName: 'users',
  defaultScope: {
    include: {
      association: 'role'
    },
  },
  scopes: {
    userVerify: {
      where: {
        verify: true
      }
    }
  }
});

Role.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  }
}, {
  sequelize: Database.getDb(),
  modelName: 'Role',
  tableName: 'roles',
});

Contact.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(128),
    allowNull: true,
    defaultValue: null,
  },
  phoneNumber: {
    type: DataTypes.STRING(128),
    allowNull: false,
    //defaultValue: null,
  },
  ownerId: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'owner_id',
  },
  extPhoto: {
    type: DataTypes.STRING,
    field: 'ext_photo',
  },
  pathPhoto: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('extPhoto') && this.getDataValue('id') ?
        `contacts/contact_${this.getDataValue('id')}${this.getDataValue('extPhoto')}` : null
    }
  },

  urlPhoto: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.getDataValue('extPhoto') && this.getDataValue('id') ?
        siteUrl(`contacts/contact_${this.getDataValue('id')}${this.getDataValue('extPhoto')}`) : null
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    field: 'updated_at',
  },
}, {
  sequelize: Database.getDb(),
  modelName: 'Contact',
  tableName: 'contacts',
});

/** CREATE ASSOCIATION **/

// user 0..* ------------- 1..1 role

User.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role'
});

Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users'
});

// user 1..1 ------------- 0..* contacts 
User.hasMany(Contact, {
  foreignKey: 'ownerId',
  as: 'contacts'
});

Contact.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});


/** INIT DB */

export default async function initDb() {

  /**synchronouis db with model */
  await Database.getDb().sync();

  /**init role */
  const result = await Promise.all([
    Role.findOrCreate({ where: { name: 'user' } }),
    Role.findOrCreate({ where: { name: 'admin' } }),
  ]);

  listRole.USER = result[0][0];
  listRole.ADMIN = result[1][0];

  /**create admin */
  await User.findOrCreate({
    where: { email: 'deffofossoderil@gmail.com' },
    defaults: {
      email: 'deffofossoderil@gmail.com',
      name: 'deril',
      roleId: listRole.ADMIN?.id,
      verify: true,
      password: await bcrypt.hash(process.env.DEFAULT_PASSWORD_ADMIN as string, parseInt(process.env.SALT_HASH as string))
    }
  })
}