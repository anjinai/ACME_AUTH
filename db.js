const { JsonWebTokenError } = require('jsonwebtoken');
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken')
const secret = process.env.JWT
const { STRING } = Sequelize;
const config = {
  logging: false
};

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

// Rewrite code to verify user?
User.byToken = async(token)=> {
  try {
    const userInfo = await jwt.verify(token, secret);
    const user = await User.findByPk(userInfo);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 404;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {
  const user = await User.findOne({
    where: {
      username,
      password
    }
  });
  if(user){
    // Creation of my token.
    const token = await jwt.sign(user.id, secret)
    console.log(user, token);
    return token; 
  }
  const error = Error('bad credentials');
  error.status = 409;
  throw error;
};

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  );
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User
  }
};