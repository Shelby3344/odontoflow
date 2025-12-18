<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\Appointment;
use App\Models\Transaction;
use App\Models\Budget;
use App\Models\User;
use App\Models\MessageTemplate;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $dentist = User::where('role', 'dentist')->first();
        
        // Criar pacientes de exemplo
        $patients = [
            ['name' => 'Maria Silva Santos', 'email' => 'maria@email.com', 'phone' => '(11) 99999-1111', 'whatsapp' => '11999991111', 'gender' => 'F', 'birth_date' => '1985-03-15'],
            ['name' => 'João Pedro Oliveira', 'email' => 'joao@email.com', 'phone' => '(11) 99999-2222', 'whatsapp' => '11999992222', 'gender' => 'M', 'birth_date' => '1990-07-22'],
            ['name' => 'Ana Carolina Lima', 'email' => 'ana@email.com', 'phone' => '(11) 99999-3333', 'whatsapp' => '11999993333', 'gender' => 'F', 'birth_date' => '1978-11-08'],
            ['name' => 'Carlos Eduardo Souza', 'email' => 'carlos@email.com', 'phone' => '(11) 99999-4444', 'whatsapp' => '11999994444', 'gender' => 'M', 'birth_date' => '1995-01-30'],
            ['name' => 'Fernanda Costa', 'email' => 'fernanda@email.com', 'phone' => '(11) 99999-5555', 'whatsapp' => '11999995555', 'gender' => 'F', 'birth_date' => '1982-09-12'],
        ];

        foreach ($patients as $patientData) {
            $patient = Patient::create([
                ...$patientData,
                'status' => 'active',
                'attendance_score' => rand(70, 100) / 100,
                'engagement_score' => rand(40, 90) / 100,
                'first_visit_at' => now()->subMonths(rand(1, 12)),
                'last_visit_at' => now()->subDays(rand(1, 60)),
            ]);

            // Criar agendamentos para cada paciente
            for ($i = 0; $i < rand(2, 5); $i++) {
                $startTime = now()->addDays(rand(-30, 30))->setHour(rand(8, 17))->setMinute(rand(0, 1) * 30);
                $status = $startTime->isPast() 
                    ? (rand(0, 10) > 2 ? 'completed' : 'no_show')
                    : (rand(0, 10) > 5 ? 'confirmed' : 'scheduled');

                Appointment::create([
                    'patient_id' => $patient->id,
                    'professional_id' => $dentist->id,
                    'start_time' => $startTime,
                    'end_time' => $startTime->copy()->addMinutes(30),
                    'duration' => 30,
                    'type' => ['consultation', 'cleaning', 'restoration', 'extraction'][rand(0, 3)],
                    'status' => $status,
                    'notes' => 'Consulta de rotina',
                ]);
            }

            // Criar transações
            for ($i = 0; $i < rand(1, 3); $i++) {
                $amount = [150, 250, 350, 500, 800, 1200][rand(0, 5)];
                $isPaid = rand(0, 10) > 3;
                
                Transaction::create([
                    'patient_id' => $patient->id,
                    'professional_id' => $dentist->id,
                    'type' => 'income',
                    'category' => 'treatment',
                    'description' => ['Consulta', 'Limpeza', 'Restauração', 'Clareamento'][rand(0, 3)],
                    'amount' => $amount,
                    'due_date' => now()->subDays(rand(-30, 30)),
                    'paid_at' => $isPaid ? now()->subDays(rand(1, 30)) : null,
                    'payment_method' => $isPaid ? ['pix', 'credit_card', 'debit_card', 'cash'][rand(0, 3)] : null,
                    'procedure_type' => ['Consulta', 'Profilaxia', 'Restauração em Resina', 'Clareamento'][rand(0, 3)],
                    'status' => $isPaid ? 'paid' : 'pending',
                ]);
            }
        }

        // Criar templates de mensagem
        $templates = [
            [
                'name' => 'Lembrete 24h',
                'type' => 'reminder',
                'channel' => 'whatsapp',
                'content' => "Olá, {primeiro_nome}! 😊\n\nLembramos que você tem consulta agendada amanhã.\n\nConfirme sua presença respondendo SIM.\n\nOdontoFlow",
            ],
            [
                'name' => 'Confirmação',
                'type' => 'confirmation',
                'channel' => 'whatsapp',
                'content' => "Olá, {primeiro_nome}!\n\nSua consulta está confirmada.\n\nAté lá! 🦷",
            ],
            [
                'name' => 'Pós-Atendimento',
                'type' => 'post_treatment',
                'channel' => 'whatsapp',
                'content' => "Olá, {primeiro_nome}!\n\nEsperamos que esteja bem após o procedimento de hoje.\n\nQualquer dúvida, estamos à disposição!",
            ],
            [
                'name' => 'Reativação',
                'type' => 'reactivation',
                'channel' => 'whatsapp',
                'content' => "Olá, {primeiro_nome}! 👋\n\nSentimos sua falta! Faz tempo que não nos vemos.\n\nQue tal agendar uma consulta de revisão?",
            ],
            [
                'name' => 'Aniversário',
                'type' => 'birthday',
                'channel' => 'whatsapp',
                'content' => "Feliz aniversário, {primeiro_nome}! 🎂🎉\n\nA equipe OdontoFlow deseja um dia maravilhoso!",
            ],
        ];

        foreach ($templates as $template) {
            MessageTemplate::create([
                ...$template,
                'is_active' => true,
            ]);
        }

        $this->command->info('Dados de demonstração criados com sucesso!');
        $this->command->info('- 5 pacientes');
        $this->command->info('- Agendamentos variados');
        $this->command->info('- Transações financeiras');
        $this->command->info('- Templates de mensagem');
    }
}
