import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recuperar Senha
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Digite seu email para receber as instruções
          </p>
        </div>

        {sent ? (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <p className="text-green-800 dark:text-green-200">
              Email enviado! Verifique sua caixa de entrada.
            </p>
            <Link to="/login" className="text-primary-600 hover:underline mt-4 inline-block">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
            <Button type="submit" className="w-full">
              Enviar instruções
            </Button>
            <Link to="/login" className="block text-center text-sm text-primary-600 hover:underline">
              Voltar ao login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
