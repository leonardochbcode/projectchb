import { Pool } from 'pg';

// A URL de conexão com o banco de dados deve ser armazenada em uma variável de ambiente
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('A variável de ambiente DATABASE_URL é obrigatória.');
}

const pool = new Pool({
  connectionString,
});

// Função para testar a conexão
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexão com o PostgreSQL estabelecida com sucesso!');
    client.release();
  } catch (error) {
    console.error('Erro ao conectar com o PostgreSQL:', error);
  }
};

export default pool;
