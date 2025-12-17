<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

class KnowledgeBaseSeeder extends Seeder
{
    public function run(): void
    {
        $knowledge = [
            // Diagnósticos
            [
                'category' => 'diagnosis',
                'subcategory' => 'carie',
                'title' => 'Cárie Dentária - Classificação e Diagnóstico',
                'content' => 'A cárie dentária é classificada em: Cárie inicial (mancha branca), Cárie de esmalte, Cárie de dentina superficial, Cárie de dentina profunda, Cárie com comprometimento pulpar. Diagnóstico baseado em: inspeção visual, sondagem, radiografia interproximal, transiluminação. Fatores de risco: higiene deficiente, dieta cariogênica, xerostomia, aparelho ortodôntico.',
            ],
            [
                'category' => 'diagnosis',
                'subcategory' => 'periodontal',
                'title' => 'Doença Periodontal - Classificação',
                'content' => 'Classificação periodontal: Gengivite (inflamação gengival reversível), Periodontite Estágio I (leve), Periodontite Estágio II (moderada), Periodontite Estágio III (severa com potencial perda dentária), Periodontite Estágio IV (severa com perda de função mastigatória). Parâmetros: profundidade de sondagem, nível de inserção clínica, sangramento à sondagem, mobilidade dentária, perda óssea radiográfica.',
            ],
            [
                'category' => 'diagnosis',
                'subcategory' => 'endodontico',
                'title' => 'Patologias Pulpares e Periapicais',
                'content' => 'Pulpite reversível: dor provocada, curta duração, sem dor espontânea. Pulpite irreversível: dor espontânea, prolongada, pode irradiar. Necrose pulpar: ausência de resposta aos testes de vitalidade, possível escurecimento coronário. Abscesso periapical agudo: dor intensa, edema, sensibilidade à percussão. Abscesso periapical crônico: fístula, assintomático ou dor leve.',
            ],
            
            // Tratamentos
            [
                'category' => 'treatment',
                'subcategory' => 'restaurador',
                'title' => 'Protocolos de Restauração Direta',
                'content' => 'Restauração em resina composta: isolamento absoluto preferencial, condicionamento ácido (30s esmalte, 15s dentina), aplicação de sistema adesivo, inserção incremental (2mm), fotopolimerização adequada, acabamento e polimento. Indicações: cavidades Classes I a V. Contraindicações relativas: impossibilidade de isolamento, bruxismo severo sem proteção.',
            ],
            [
                'category' => 'treatment',
                'subcategory' => 'endodontico',
                'title' => 'Protocolo de Tratamento Endodôntico',
                'content' => 'Etapas do tratamento endodôntico: anestesia, isolamento absoluto, acesso coronário, localização dos canais, odontometria (eletrônica e radiográfica), preparo químico-mecânico, irrigação (hipoclorito de sódio 2,5%), medicação intracanal (hidróxido de cálcio), obturação (guta-percha + cimento), restauração definitiva. Número de sessões: 1-3 dependendo do caso.',
            ],
            [
                'category' => 'treatment',
                'subcategory' => 'cirurgico',
                'title' => 'Protocolo de Exodontia',
                'content' => 'Exodontia simples: anestesia local, sindesmotomia, luxação com elevadores, extração com fórceps, curetagem alveolar, hemostasia, orientações pós-operatórias. Medicação: analgésico (dipirona ou paracetamol), anti-inflamatório se necessário, antibiótico em casos selecionados. Orientações: não bochechar 24h, alimentação pastosa, repouso relativo, compressa fria.',
            ],
            
            // Protocolos
            [
                'category' => 'protocols',
                'subcategory' => 'biosseguranca',
                'title' => 'Protocolo de Biossegurança',
                'content' => 'EPIs obrigatórios: jaleco, gorro, máscara (N95 para aerossóis), óculos de proteção, luvas. Esterilização: autoclave 121°C/15min ou 134°C/4min. Desinfecção de superfícies: álcool 70% ou hipoclorito 1%. Descarte de perfurocortantes: caixa Descarpack. Lavagem das mãos: antes e após cada atendimento.',
            ],
            [
                'category' => 'protocols',
                'subcategory' => 'emergencia',
                'title' => 'Protocolo de Emergências Médicas',
                'content' => 'Síncope: posição de Trendelenburg, afrouxar roupas, oxigênio se disponível. Reação alérgica leve: anti-histamínico oral. Anafilaxia: epinefrina 0,3-0,5mg IM, chamar SAMU. Crise hipertensiva: interromper procedimento, monitorar PA, captopril sublingual se disponível. Hipoglicemia: glicose oral ou IV.',
            ],
            
            // Medicamentos
            [
                'category' => 'medications',
                'subcategory' => 'analgesicos',
                'title' => 'Prescrição de Analgésicos',
                'content' => 'Dipirona 500mg: 1 comprimido de 6/6h se dor. Paracetamol 750mg: 1 comprimido de 6/6h se dor. Ibuprofeno 600mg: 1 comprimido de 8/8h por 3 dias (com alimento). Nimesulida 100mg: 1 comprimido de 12/12h por 3 dias (com alimento). Contraindicações: verificar alergias, gestação, problemas gástricos, renais ou hepáticos.',
            ],
            [
                'category' => 'medications',
                'subcategory' => 'antibioticos',
                'title' => 'Prescrição de Antibióticos',
                'content' => 'Amoxicilina 500mg: 1 cápsula de 8/8h por 7 dias. Amoxicilina + Clavulanato 875mg: 1 comprimido de 12/12h por 7 dias. Azitromicina 500mg: 1 comprimido ao dia por 3 dias. Clindamicina 300mg: 1 cápsula de 8/8h por 7 dias (alérgicos a penicilina). Metronidazol 400mg: 1 comprimido de 8/8h por 7 dias (infecções anaeróbias).',
            ],
            
            // Orientações
            [
                'category' => 'guidelines',
                'subcategory' => 'pos_operatorio',
                'title' => 'Orientações Pós-Operatórias Gerais',
                'content' => 'Após procedimentos cirúrgicos: morder gaze por 30 minutos, não bochechar nas primeiras 24h, alimentação pastosa e fria, evitar esforço físico, não fumar, não ingerir bebidas alcoólicas, tomar medicação conforme prescrito, aplicar compressa fria nas primeiras 24h, retornar se houver sangramento excessivo, dor intensa ou febre.',
            ],
            [
                'category' => 'guidelines',
                'subcategory' => 'higiene',
                'title' => 'Orientações de Higiene Bucal',
                'content' => 'Escovação: 3x ao dia, após as refeições, por pelo menos 2 minutos. Técnica de Bass modificada para adultos. Fio dental: 1x ao dia, preferencialmente à noite. Enxaguatório: se indicado, após escovação e fio dental. Troca de escova: a cada 3 meses ou quando cerdas deformadas. Visitas ao dentista: a cada 6 meses para prevenção.',
            ],
        ];

        foreach ($knowledge as $item) {
            DB::table('knowledge_base')->insert([
                'id' => Uuid::uuid4()->toString(),
                'category' => $item['category'],
                'subcategory' => $item['subcategory'],
                'title' => $item['title'],
                'content' => $item['content'],
                'metadata' => json_encode(['source' => 'initial_seed']),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
