import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Target, ArrowRight, BarChart3, Users, Zap, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  const { t, i18n } = useTranslation();

  const features = [
    { icon: Target, title: 'OKRs Hierárquicos', desc: 'Relacione OKRs pai e filhos' },
    { icon: BarChart3, title: 'Indicadores Scrum', desc: 'Métricas por sprint' },
    { icon: Users, title: 'Gestão de Equipes', desc: 'Multi-tenant com papéis' },
    { icon: Zap, title: 'Feed em Tempo Real', desc: 'Notificações automáticas' },
    { icon: Shield, title: 'Segurança Avançada', desc: 'JWT, bcrypt, auditoria' },
    { icon: Globe, title: 'Multi-idioma', desc: 'PT-BR, EN, ES' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-info/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary glow">
            <Target className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">OKRs View</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {['pt-BR', 'en', 'es'].map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  i18n.changeLanguage(lang);
                  localStorage.setItem('language', lang);
                }}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  i18n.language === lang
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {lang.toUpperCase().split('-')[0]}
              </button>
            ))}
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm">
              {t('auth.login')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-xs font-medium text-primary">SAFe & Scrum Ready</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Gestão de{' '}
            <span className="gradient-text">OKRs</span>
            {' '}para equipes ágeis
          </h1>
          
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Plataforma multi-tenant para gerenciar objetivos, indicadores Scrum, 
            equipes e documentação. Integrado com SAFe para escalar sua organização.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="glow group">
                Começar Agora
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Ver Demo
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              className="group glass rounded-xl p-6 hover:border-primary/30 transition-all duration-300 cursor-default"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2024 OKRs View. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

export default Index;
