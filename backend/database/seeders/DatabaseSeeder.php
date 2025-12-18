<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::create([
            'name' => 'Administrador',
            'email' => 'admin@odontoflow.com.br',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        // Dentist user
        User::create([
            'name' => 'Dr. Carlos Silva',
            'email' => 'dentista@odontoflow.com.br',
            'password' => Hash::make('dentista123'),
            'role' => 'dentist',
            'professional_id' => 'CRO-SP 12345',
            'professional_state' => 'SP',
            'specialty' => 'Clínico Geral',
            'is_active' => true,
        ]);

        // Receptionist user
        User::create([
            'name' => 'Maria Recepção',
            'email' => 'recepcao@odontoflow.com.br',
            'password' => Hash::make('recepcao123'),
            'role' => 'receptionist',
            'is_active' => true,
        ]);

        $this->command->info('Usuários criados:');
        $this->command->info('Admin: admin@odontoflow.com.br / admin123');
        $this->command->info('Dentista: dentista@odontoflow.com.br / dentista123');
        $this->command->info('Recepção: recepcao@odontoflow.com.br / recepcao123');
    }
}
