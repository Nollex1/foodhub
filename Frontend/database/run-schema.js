const { pool } = require('../Backend/config/database');
const fs = require('fs');
const path = require('path');

async function runSchema() {
    try {
        console.log('Running database schema...');

        // Read the schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

        // Split the schema into individual statements
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    await pool.query(statement);
                    console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
                } catch (error) {
                    console.log(`⚠️  Statement ${i + 1} failed:`, error.message);
                    // Continue with other statements
                }
            }
        }

        console.log('✅ Schema execution completed');

    } catch (error) {
        console.error('❌ Schema execution failed:', error.message);
    } finally {
        pool.end();
    }
}

runSchema();