import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  useWikiCategories,
  useWikiDocuments,
  useWikiDocument,
  useWikiMutations,
  WikiDocument,
  WikiVersion,
} from '@/hooks/useWiki';
import {
  WikiDocumentList,
  WikiDocumentViewer,
  WikiDocumentEditor,
  WikiCategoryDialog,
} from '@/components/wiki';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const WikiPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasMinimumRole, getTenantId } = useAuth();
  const tenantId = getTenantId();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<WikiDocument | null>(null);
  const [restoreVersion, setRestoreVersion] = useState<{ documentId: string; version: WikiVersion } | null>(null);

  // Data hooks
  const { data: categories = [], isLoading: categoriesLoading } = useWikiCategories();
  const { data: documents = [], isLoading: documentsLoading } = useWikiDocuments(
    selectedCategoryId,
    searchQuery
  );
  const { data: selectedDocument } = useWikiDocument(selectedDocumentId);

  // Mutations
  const {
    createDocument,
    updateDocument,
    createCategory,
    restoreVersion: restoreVersionMutation,
  } = useWikiMutations();

  const canEdit = hasMinimumRole('leader');

  // Handlers
  const handleSelectDocument = useCallback((doc: WikiDocument) => {
    setSelectedDocumentId(doc.id);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedDocumentId(null);
    setEditingDocument(null);
  }, []);

  const handleCreateDocument = useCallback(() => {
    setEditingDocument(null);
    setIsEditorOpen(true);
  }, []);

  const handleEditDocument = useCallback(() => {
    if (selectedDocument) {
      setEditingDocument(selectedDocument);
      setIsEditorOpen(true);
    }
  }, [selectedDocument]);

  const handleSaveDocument = useCallback(
    async (data: { title: string; content: string; category_id?: string | null }) => {
      if (editingDocument) {
        await updateDocument.mutateAsync({
          id: editingDocument.id,
          ...data,
        });
      } else {
        await createDocument.mutateAsync(data);
      }
      setIsEditorOpen(false);
      setEditingDocument(null);
    },
    [editingDocument, createDocument, updateDocument]
  );

  const handleSaveCategory = useCallback(
    async (data: { name: string; slug: string; description?: string }) => {
      await createCategory.mutateAsync(data);
      setIsCategoryDialogOpen(false);
    },
    [createCategory]
  );

  const handleRestoreVersion = useCallback((version: WikiVersion) => {
    if (selectedDocumentId) {
      setRestoreVersion({ documentId: selectedDocumentId, version });
    }
  }, [selectedDocumentId]);

  const confirmRestoreVersion = useCallback(async () => {
    if (restoreVersion) {
      await restoreVersionMutation.mutateAsync({
        documentId: restoreVersion.documentId,
        version: restoreVersion.version,
      });
      setRestoreVersion(null);
    }
  }, [restoreVersion, restoreVersionMutation]);

  // Access check
  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">{t('common.accessDenied')}</p>
        </Card>
      </div>
    );
  }

  // Document view mode
  if (selectedDocument) {
    return (
      <div className="space-y-6">
        <WikiDocumentViewer
          document={selectedDocument}
          onBack={handleBackToList}
          onEdit={handleEditDocument}
          onRestoreVersion={handleRestoreVersion}
        />

        <WikiDocumentEditor
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          document={editingDocument}
          categories={categories}
          onSave={handleSaveDocument}
          isLoading={updateDocument.isPending}
        />

        <AlertDialog open={!!restoreVersion} onOpenChange={() => setRestoreVersion(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('wiki.restoreVersionTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('wiki.restoreVersionDesc', { version: restoreVersion?.version.version_number })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRestoreVersion}>
                {t('wiki.restore')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Document list mode
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            {t('wiki.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">{t('wiki.pageSubtitle')}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCategoryDialogOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              {t('wiki.createCategory')}
            </Button>
            <Button size="sm" className="glow" onClick={handleCreateDocument}>
              <Plus className="mr-2 h-4 w-4" />
              {t('wiki.createPage')}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('wiki.searchPages')}
          className="pl-10 bg-muted/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </motion.div>

      {/* Category tabs and document list */}
      <motion.div variants={itemVariants}>
        <Tabs
          value={selectedCategoryId || 'all'}
          onValueChange={(value) => setSelectedCategoryId(value === 'all' ? null : value)}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all">{t('wiki.allDocuments')}</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id}>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategoryId || 'all'} className="mt-0">
            {documentsLoading ? (
              <div className="flex justify-center py-12">
                <p className="text-muted-foreground">{t('common.loading')}</p>
              </div>
            ) : (
              <WikiDocumentList
                documents={documents}
                onSelectDocument={handleSelectDocument}
                selectedDocumentId={selectedDocumentId}
              />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Dialogs */}
      <WikiDocumentEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        document={editingDocument}
        categories={categories}
        onSave={handleSaveDocument}
        isLoading={createDocument.isPending || updateDocument.isPending}
      />

      <WikiCategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onSave={handleSaveCategory}
        isLoading={createCategory.isPending}
      />
    </motion.div>
  );
};

export default WikiPage;
