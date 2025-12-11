import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BarChart3, Eye, EyeOff, Loader2, User, Check, X, Globe, Accessibility, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  loginSchema, 
  signupSchema, 
  getPasswordStrength,
} from '@/lib/validations/auth';

const LANGUAGES = [
  { code: 'pt-BR', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

type AuthView = 'auth' | 'forgot-password';

const AuthPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, isLoading, isAuthenticated, profile } = useAuth();
  
  const [currentView, setCurrentView] = useState<AuthView>('auth');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect based on role after authentication
  useEffect(() => {
    if (isAuthenticated && profile) {
      if (profile.role === 'root') {
        navigate('/tenants', { replace: true });
      } else {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, profile, navigate, location]);

  // Password strength indicator
  const passwordStrength = getPasswordStrength(formData.password);

  // Password requirements checklist
  const passwordRequirements = [
    { label: t('auth.requirements.minLength'), met: formData.password.length >= 10 },
    { label: t('auth.requirements.uppercase'), met: /[A-Z]/.test(formData.password) },
    { label: t('auth.requirements.lowercase'), met: /[a-z]/.test(formData.password) },
    { label: t('auth.requirements.number'), met: /[0-9]/.test(formData.password) },
    { label: t('auth.requirements.special'), met: /[^A-Za-z0-9]/.test(formData.password) },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = loginSchema.safeParse({
      email: formData.email,
      password: formData.password,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await login(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('Invalid login')) {
          toast.error(t('auth.errors.invalidCredentials'));
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      toast.success(t('auth.success.login'));
    } catch {
      toast.error(t('auth.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signup(formData.email, formData.password, formData.name);
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success(t('auth.success.signup'));
      // Redirect to login after successful signup
      setActiveTab('login');
      setFormData({ email: formData.email, password: '', confirmPassword: '', name: '' });
    } catch {
      toast.error(t('auth.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      setErrors({ forgotEmail: t('auth.errors.invalidEmail') });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await supabase.functions.invoke('forgot-password', {
        body: { email: forgotPasswordEmail.trim().toLowerCase() },
      });

      // Always show success message for security
      setForgotPasswordSent(true);
      toast.success(t('auth.forgotPassword.successMessage'));
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setCurrentView('auth');
        setForgotPasswordSent(false);
        setForgotPasswordEmail('');
      }, 3000);

    } catch {
      // Still show success for security
      setForgotPasswordSent(true);
      toast.success(t('auth.forgotPassword.successMessage'));
      
      setTimeout(() => {
        setCurrentView('auth');
        setForgotPasswordSent(false);
        setForgotPasswordEmail('');
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const currentLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-auth-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-auth-background">
      {/* Top right controls */}
      <div className="flex justify-end items-center gap-2 p-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Accessibility className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-background border-border">
              <Globe className="h-4 w-4" />
              {currentLanguage.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={i18n.language === lang.code ? 'bg-accent' : ''}
              >
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
              <BarChart3 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {currentView === 'forgot-password' ? t('auth.forgotPassword.title') : 'OKRs View'}
            </h1>
            <p className="text-muted-foreground mt-1 text-center">
              {currentView === 'forgot-password' 
                ? t('auth.forgotPassword.subtitle')
                : (activeTab === 'login' ? t('auth.subtitle') : t('auth.signupSubtitle'))}
            </p>
          </div>

          {/* Forgot Password View */}
          {currentView === 'forgot-password' && (
            <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
              {forgotPasswordSent ? (
                <div className="text-center py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-foreground font-medium mb-2">
                    {t('auth.forgotPassword.successTitle')}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t('auth.forgotPassword.successMessage')}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">{t('auth.email')}</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => {
                        setForgotPasswordEmail(e.target.value);
                        if (errors.forgotEmail) {
                          setErrors(prev => ({ ...prev, forgotEmail: '' }));
                        }
                      }}
                      className="bg-background"
                      placeholder={t('auth.placeholders.email')}
                      autoComplete="email"
                    />
                    {errors.forgotEmail && <p className="text-xs text-destructive">{errors.forgotEmail}</p>}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.forgotPassword.submit')}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    {t('auth.forgotPassword.rememberedPassword')}{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary p-0 h-auto font-medium"
                      onClick={() => {
                        setCurrentView('auth');
                        setForgotPasswordEmail('');
                        setErrors({});
                      }}
                    >
                      {t('auth.forgotPassword.backToLogin')}
                    </Button>
                  </p>
                </form>
              )}
            </div>
          )}

          {/* Auth Card */}
          {currentView === 'auth' && (
            <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted">
                <TabsTrigger value="login" className="data-[state=active]:bg-background">
                  {t('auth.login')}
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-background">
                  {t('auth.signup')}
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="mt-0 space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t('auth.email')}</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-background"
                      placeholder={t('auth.placeholders.email')}
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        className="bg-background pr-10"
                        placeholder={t('auth.placeholders.password')}
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary p-0 h-auto font-normal text-sm"
                      onClick={() => setCurrentView('forgot-password')}
                    >
                      {t('auth.forgotPassword.link')}
                    </Button>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.login')}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0 space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{t('auth.name')}</Label>
                    <div className="relative">
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="bg-background"
                        placeholder={t('auth.placeholders.name')}
                        autoComplete="name"
                      />
                    </div>
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t('auth.email')}</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-background"
                      placeholder={t('auth.placeholders.email')}
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        className="bg-background pr-10"
                        placeholder={t('auth.placeholders.password')}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {/* Password Strength */}
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(passwordStrength.score / 6) * 100} 
                            className="h-1.5 flex-1"
                            indicatorClassName={passwordStrength.color}
                          />
                          <span className={`text-xs font-medium ${
                            passwordStrength.score <= 2 ? 'text-destructive' :
                            passwordStrength.score <= 4 ? 'text-warning' : 'text-success'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        
                        {/* Requirements Checklist */}
                        <div className="grid grid-cols-2 gap-1">
                          {passwordRequirements.map((req, index) => (
                            <div key={index} className="flex items-center gap-1.5 text-xs">
                              {req.met ? (
                                <Check className="h-3 w-3 text-success" />
                              ) : (
                                <X className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className={req.met ? 'text-success' : 'text-muted-foreground'}>
                                {req.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">{t('auth.confirmPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="bg-background pr-10"
                        placeholder={t('auth.placeholders.confirmPassword')}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth.createAccount')}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    {t('auth.hasAccount')}{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="text-primary p-0 h-auto font-medium"
                      onClick={() => setActiveTab('login')}
                    >
                      {t('auth.doLogin')}
                    </Button>
                  </p>
                </form>
              </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {t('auth.copyright', { year: new Date().getFullYear() })}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
