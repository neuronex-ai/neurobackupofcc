/**
 * Script to seed 50 test patients for the jotahub@gmail.com account
 * Run with: npx tsx scripts/seed-test-patients.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xvkryimqxnxfrcnplucs.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Target psychologist email
const PSYCHOLOGIST_EMAIL = 'jotahub@gmail.com';

// Brazilian first names
const firstNames = [
    'Ana', 'Maria', 'José', 'João', 'Pedro', 'Lucas', 'Gabriel', 'Matheus',
    'Larissa', 'Julia', 'Beatriz', 'Mariana', 'Fernanda', 'Carolina', 'Amanda',
    'Rafael', 'Bruno', 'Carlos', 'Diego', 'Eduardo', 'Felipe', 'Gustavo',
    'Isabela', 'Jessica', 'Karen', 'Laura', 'Leticia', 'Marcela', 'Natalia',
    'Patricia', 'Renata', 'Sandra', 'Tatiana', 'Vanessa', 'Viviane',
    'Andre', 'Caio', 'Daniel', 'Fabio', 'Henrique', 'Igor', 'Leonardo',
    'Marcos', 'Nicolas', 'Otavio', 'Paulo', 'Ricardo', 'Sergio', 'Thiago', 'Victor'
];

// Brazilian last names
const lastNames = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
    'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
    'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha',
    'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado',
    'Mendes', 'Freitas', 'Cardoso', 'Ramos', 'Gonçalves', 'Santana', 'Teixeira'
];

// Generate random phone number (Brazilian format)
const generatePhone = () => {
    const ddd = ['11', '21', '31', '41', '51', '61', '71', '81', '85', '19'][Math.floor(Math.random() * 10)];
    const num = Math.floor(Math.random() * 900000000) + 100000000;
    return `+55${ddd}9${num.toString().slice(0, 8)}`;
};

// Generate random CPF (Brazilian tax ID - fake but valid format)
const generateCPF = () => {
    const n = () => Math.floor(Math.random() * 10);
    return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
};

// Generate random birth date (age 18-65)
const generateBirthDate = () => {
    const now = new Date();
    const minAge = 18;
    const maxAge = 65;
    const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    const birthYear = now.getFullYear() - age;
    const birthMonth = Math.floor(Math.random() * 12);
    const birthDay = Math.floor(Math.random() * 28) + 1;
    return new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0];
};

// Main diagnoses/notes
const diagnoses = [
    'Transtorno de Ansiedade Generalizada',
    'Episódio Depressivo Moderado',
    'Transtorno de Pânico',
    'TDAH - Tipo Combinado',
    'Transtorno Obsessivo-Compulsivo',
    'Fobia Social',
    'Transtorno de Estresse Pós-Traumático',
    'Transtorno Bipolar Tipo II',
    'Depressão Recorrente',
    'Burnout',
    'Transtorno de Personalidade Borderline',
    'Luto Patológico',
    'Transtorno Alimentar - Bulimia',
    'Insônia Crônica',
    'Dificuldades de Relacionamento',
];

// Session frequency
const frequencies = ['semanal', 'quinzenal', 'mensal'];

// Statuses
const statuses: ('active' | 'pending' | 'inactive')[] = ['active', 'active', 'active', 'active', 'pending', 'inactive'];

// Generate a patient object
const generatePatient = (index: number, userId: string) => {
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const secondLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName} ${secondLastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@teste.neuronex.app`;

    return {
        user_id: userId,
        name: fullName,
        email: email,
        phone: generatePhone(),
        cpf: generateCPF(),
        birth_date: generateBirthDate(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        session_price: [150, 180, 200, 250, 300][Math.floor(Math.random() * 5)],
        session_frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
        notes: `Diagnóstico principal: ${diagnoses[Math.floor(Math.random() * diagnoses.length)]}. Paciente de teste para carga do sistema.`,
        created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(), // Random date in last 6 months
    };
};

async function main() {
    console.log('🌱 Starting test patient seed...\n');

    // Get user ID from environment variable
    const USER_ID = process.env.TARGET_USER_ID;

    if (!USER_ID) {
        console.error('❌ Error: TARGET_USER_ID environment variable not set\n');
        console.log('To find the user ID for jotahub@gmail.com:');
        console.log('1. Go to Supabase Dashboard → Authentication → Users');
        console.log('2. Find jotahub@gmail.com');
        console.log('3. Copy the UUID');
        console.log('4. Run: TARGET_USER_ID="your-uuid-here" npx tsx scripts/seed-test-patients.ts\n');
        process.exit(1);
    }

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xvkryimqxnxfrcnplucs.supabase.co';
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_SERVICE_KEY) {
        console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set\n');
        console.log('Get the service role key from Supabase Dashboard → Settings → API');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log(`📎 Target user: ${USER_ID}`);
    console.log('📝 Generating 50 test patients...\n');

    // Generate 50 patients
    const patients = Array.from({ length: 50 }, (_, i) => generatePatient(i, USER_ID));

    // Insert patients in batches
    console.log('💾 Inserting patients into database...\n');

    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < patients.length; i += batchSize) {
        const batch = patients.slice(i, i + batchSize);

        const { data, error } = await supabase
            .from('patients')
            .insert(batch)
            .select('id, name');

        if (error) {
            console.error(`❌ Batch ${i / batchSize + 1} failed:`, error.message);
            errorCount += batch.length;
        } else {
            console.log(`✅ Batch ${i / batchSize + 1}: Inserted ${data?.length || 0} patients`);
            successCount += data?.length || 0;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Seed Complete!');
    console.log(`   ✅ Patients created: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(50));
}

main().catch(console.error);
