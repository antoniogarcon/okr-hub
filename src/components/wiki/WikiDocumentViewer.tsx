import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Edit, 
  Clock, 
  User, 
  History, 
  FolderOpen,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { WikiDocument, WikiVersion, useWikiVersions } from '@/hooks/useWiki';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';

interface WikiDocumentViewerProps {
  document: WikiDocument;
  onBack: () => void;
  onEdit: () => void;
  onRestoreVersion: (version: WikiVersion) => void;
}

const getLocale = (lang: string) => {
  switch (lang) {
    case 'pt-BR':
      return ptBR;
    case 'es':
      return es;
    default:
      return enUS;
  }
};

// Simple markdown-like rendering
const renderContent = (content: string) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];

  lines.forEach((line, index) => {
    // Code block
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${index}`} className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
            <code className="text-sm">{codeContent.join('\n')}</code>
          </pre>
        );
        codeContent = [];
      }
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      return;
    }

    // Headers
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="text-2xl font-bold mt-8 mb-4 text-foreground">
          {line.substring(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-xl font-semibold mt-6 mb-3 text-foreground">
          {line.substring(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-lg font-medium mt-4 mb-2 text-foreground">
          {line.substring(4)}
        </h3>
      );
    }
    // Bold
    else if (line.includes('**')) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      elements.push(
        <p key={index} className="text-muted-foreground mb-2">
          {parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
          )}
        </p>
      );
    }
    // Lists
    else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <li key={index} className="text-muted-foreground ml-4 mb-1">
          {line.substring(2)}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <li key={index} className="text-muted-foreground ml-4 mb-1 list-decimal">
          {line.replace(/^\d+\.\s/, '')}
        </li>
      );
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={index} className="h-4" />);
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={index} className="text-muted-foreground mb-2">
          {line}
        </p>
      );
    }
  });

  return elements;
};

// Table of contents extraction
const extractTOC = (content: string) => {
  const lines = content.split('\n');
  const toc: { level: number; text: string; id: string }[] = [];

  lines.forEach((line) => {
    if (line.startsWith('# ')) {
      toc.push({ level: 1, text: line.substring(2), id: line.substring(2).toLowerCase().replace(/\s+/g, '-') });
    } else if (line.startsWith('## ')) {
      toc.push({ level: 2, text: line.substring(3), id: line.substring(3).toLowerCase().replace(/\s+/g, '-') });
    } else if (line.startsWith('### ')) {
      toc.push({ level: 3, text: line.substring(4), id: line.substring(4).toLowerCase().replace(/\s+/g, '-') });
    }
  });

  return toc;
};

export const WikiDocumentViewer: React.FC<WikiDocumentViewerProps> = ({
  document,
  onBack,
  onEdit,
  onRestoreVersion,
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { hasMinimumRole } = useAuth();
  const locale = getLocale(currentLanguage);
  const [showVersions, setShowVersions] = useState(false);

  const { data: versions = [], isLoading: versionsLoading } = useWikiVersions(
    showVersions ? document.id : null
  );

  const toc = extractTOC(document.content);
  const canEdit = hasMinimumRole('leader');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('wiki.backToList')}
          </Button>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {t('wiki.editPage')}
            </Button>
          )}
        </div>
      </div>

      {/* Document metadata */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {document.category && (
          <Badge variant="outline">
            <FolderOpen className="h-3 w-3 mr-1" />
            {document.category.name}
          </Badge>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          {t('wiki.lastUpdated')}: {format(new Date(document.updated_at), 'PPp', { locale })}
        </span>
        {document.author && (
          <span className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={document.author.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">
                {document.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {document.author.name}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_250px]">
        {/* Main content */}
        <Card className="glass border-border/50">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-6 text-foreground">{document.title}</h1>
            <Separator className="mb-6" />
            <article className="prose prose-sm max-w-none dark:prose-invert">
              {renderContent(document.content)}
            </article>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Table of Contents */}
          {toc.length > 0 && (
            <Card className="glass border-border/50">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">{t('wiki.tableOfContents')}</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <nav className="space-y-1">
                  {toc.map((item, index) => (
                    <a
                      key={index}
                      href={`#${item.id}`}
                      className={`block text-sm text-muted-foreground hover:text-foreground transition-colors ${
                        item.level === 2 ? 'pl-3' : item.level === 3 ? 'pl-6' : ''
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </CardContent>
            </Card>
          )}

          {/* Version History */}
          <Card className="glass border-border/50">
            <CardHeader className="py-3">
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto"
                onClick={() => setShowVersions(!showVersions)}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <History className="h-4 w-4" />
                  {t('wiki.history')}
                </span>
                {showVersions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CardHeader>
            {showVersions && (
              <CardContent className="py-2 space-y-2">
                {versionsLoading ? (
                  <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                ) : versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('wiki.noVersions')}</p>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between text-xs border-b border-border/50 pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium">v{version.version_number}</p>
                        <p className="text-muted-foreground">
                          {formatDistanceToNow(new Date(version.created_at), {
                            addSuffix: true,
                            locale,
                          })}
                        </p>
                      </div>
                      {canEdit && version.version_number !== versions[0]?.version_number && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => onRestoreVersion(version)}
                        >
                          {t('wiki.restore')}
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
