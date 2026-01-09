import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, Clock, User, FolderOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { WikiDocument } from '@/hooks/useWiki';
import { useLanguage } from '@/hooks/useLanguage';

interface WikiDocumentListProps {
  documents: WikiDocument[];
  onSelectDocument: (doc: WikiDocument) => void;
  selectedDocumentId?: string | null;
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

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export const WikiDocumentList: React.FC<WikiDocumentListProps> = ({
  documents,
  onSelectDocument,
  selectedDocumentId,
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const locale = getLocale(currentLanguage);

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{t('wiki.noDocuments')}</p>
        <p className="text-sm text-muted-foreground/70">{t('wiki.noDocumentsDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc, index) => (
        <motion.div
          key={doc.id}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: index * 0.05 }}
        >
          <Card
            className={`cursor-pointer transition-all hover:bg-accent/50 ${
              selectedDocumentId === doc.id ? 'border-primary bg-accent/30' : 'border-border/50'
            }`}
            onClick={() => onSelectDocument(doc)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{doc.title}</h3>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {doc.category && (
                      <Badge variant="outline" className="text-xs">
                        <FolderOpen className="h-3 w-3 mr-1" />
                        {doc.category.name}
                      </Badge>
                    )}
                    
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(doc.updated_at), {
                        addSuffix: true,
                        locale,
                      })}
                    </span>
                    
                    {doc.author && (
                      <span className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={doc.author.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {doc.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {doc.author.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
