# 🎨 Bibliothèque de Composants AURA

> Design System unifié pour l'application Go-Prod AURA

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Composants disponibles](#composants-disponibles)
- [Nouveau : Table Component](#nouveau--table-component)
- [Hooks utilitaires](#hooks-utilitaires)
- [Standards de design](#standards-de-design)

---

## Vue d'ensemble

AURA est le design system de l'application Go-Prod. Il garantit une cohérence visuelle et comportementale à travers toutes les pages de l'application.

### Principes de base

- **Cohérence** : Tous les composants suivent les mêmes patterns visuels
- **Mode sombre/clair** : Support complet avec Tailwind CSS
- **Accessibilité** : Composants conformes aux standards WCAG
- **Réutilisabilité** : Composants modulaires et composables

---

## Composants disponibles

### 🔘 Button
Boutons avec variantes (primary, secondary, danger) et états (loading, disabled).

```tsx
import { Button } from '@/components/aura/Button';

<Button variant="primary">Enregistrer</Button>
<Button variant="secondary">Annuler</Button>
```

### 🏷️ Badge
Étiquettes colorées pour afficher des statuts ou catégories.

```tsx
import { Badge } from '@/components/aura/Badge';

<Badge variant="violet">Booking Agent</Badge>
<Badge variant="success">Actif</Badge>
```

### 📝 Input
Champs de saisie avec support d'icônes et validation.

```tsx
import { Input } from '@/components/aura/Input';

<Input 
  type="text" 
  placeholder="Rechercher..." 
  icon={<Search />}
/>
```

### 📱 PhoneInput
Champ de saisie spécialisé pour les numéros de téléphone.

```tsx
import { PhoneInput } from '@/components/aura/PhoneInput';

<PhoneInput 
  value={phone}
  onChange={setPhone}
/>
```

### 🎴 Card
Conteneurs avec header et body pour organiser le contenu.

```tsx
import { Card, CardHeader, CardBody } from '@/components/aura/Card';

<Card>
  <CardHeader>Titre</CardHeader>
  <CardBody>Contenu...</CardBody>
</Card>
```

### 🔲 Modal
Fenêtres modales pour les formulaires et confirmations.

```tsx
import { Modal } from '@/components/aura/Modal';

<Modal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  title="Ajouter un contact"
>
  {/* Contenu du modal */}
</Modal>
```

### ⚠️ ConfirmDialog
Dialogues de confirmation pour les actions destructives.

```tsx
import { ConfirmDialog } from '@/components/aura/ConfirmDialog';

<ConfirmDialog
  open={showConfirm}
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
  title="Supprimer le contact"
  message="Cette action est irréversible."
/>
```

### 📄 PageHeader
En-tête standardisé pour toutes les pages.

```tsx
import { PageHeader } from '@/components/aura/PageHeader';

<PageHeader
  title="Contacts"
  icon={<Users />}
  actions={<Button>Ajouter</Button>}
/>
```

### 🔄 ViewModeToggle
Bascule entre vue grille et vue liste.

```tsx
import { ViewModeToggle } from '@/components/aura/ViewModeToggle';

<ViewModeToggle 
  mode={viewMode}
  onChange={setViewMode}
/>
```

### 📭 EmptyState
Affichage d'état vide avec message et action.

```tsx
import { EmptyState } from '@/components/aura/EmptyState';

<EmptyState
  icon={<Users />}
  title="Aucun contact"
  message="Ajoutez votre premier contact"
  action={<Button>Ajouter</Button>}
/>
```

### 🔔 Toast / ToastProvider
Notifications toast pour les feedbacks utilisateur.

```tsx
import { useToast } from '@/components/aura/ToastProvider';

const { success, error } = useToast();

success('Contact ajouté avec succès');
error('Une erreur est survenue');
```

---

## Nouveau : Table Component

### 📊 Table
**Composant de table unifié avec tri, hover et design cohérent.**

#### Caractéristiques

✅ **Design unifié** : Couleurs, bordures et espacements harmonisés  
✅ **Mode sombre/clair** : Support complet avec transitions fluides  
✅ **Tri intégré** : Chevrons et indicateurs visuels automatiques  
✅ **Hover élégant** : Effet de survol avec `var(--color-hover-row)`  
✅ **Composable** : Architecture modulaire avec sous-composants  
✅ **TypeScript** : Typage complet pour une meilleure DX  

#### Installation

Le composant Table est déjà disponible dans `src/components/aura/Table.tsx`.

#### Utilisation de base

```tsx
import { Table } from '@/components/aura/Table';

<Table>
  <Table.Head>
    <Table.Row hoverable={false}>
      <Table.HeaderCell>Nom</Table.HeaderCell>
      <Table.HeaderCell>Email</Table.HeaderCell>
      <Table.HeaderCell align="right">Actions</Table.HeaderCell>
    </Table.Row>
  </Table.Head>
  <Table.Body>
    {data.map((item) => (
      <Table.Row key={item.id}>
        <Table.Cell>{item.name}</Table.Cell>
        <Table.Cell>{item.email}</Table.Cell>
        <Table.Cell align="right">
          <button>Modifier</button>
        </Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
</Table>
```

#### Utilisation avec tri

```tsx
import { Table } from '@/components/aura/Table';
import { useTableSort } from '@/hooks/useTableSort';

const MyComponent = () => {
  const { sortedData, handleSort, getSortState } = useTableSort(
    contacts, 
    'name', // colonne initiale
    'asc'   // direction initiale
  );

  return (
    <Table>
      <Table.Head>
        <Table.Row hoverable={false}>
          <Table.HeaderCell
            sortable
            sorted={getSortState('name')}
            onClick={() => handleSort('name')}
          >
            Nom
          </Table.HeaderCell>
          <Table.HeaderCell
            sortable
            sorted={getSortState('email')}
            onClick={() => handleSort('email')}
          >
            Email
          </Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {sortedData.map((contact) => (
          <Table.Row key={contact.id}>
            <Table.Cell>{contact.name}</Table.Cell>
            <Table.Cell>{contact.email}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};
```

#### Props des sous-composants

##### `Table.HeaderCell`

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `sortable` | `boolean` | `false` | Rend la colonne triable |
| `sorted` | `'asc' \| 'desc' \| null` | `null` | État de tri actuel |
| `onClick` | `() => void` | - | Callback au clic |
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Alignement du texte |
| `className` | `string` | `''` | Classes CSS additionnelles |

##### `Table.Cell`

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `align` | `'left' \| 'center' \| 'right'` | `'left'` | Alignement du texte |
| `colSpan` | `number` | - | Fusion de colonnes |
| `className` | `string` | `''` | Classes CSS additionnelles |

##### `Table.Row`

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `hoverable` | `boolean` | `true` | Active l'effet hover |
| `onClick` | `() => void` | - | Callback au clic (rend la ligne cliquable) |
| `className` | `string` | `''` | Classes CSS additionnelles |

#### Exemples complets

Consultez `src/components/aura/Table.example.tsx` pour des exemples détaillés :
- Table simple
- Table avec tri
- Table avec photos et badges
- Table avec actions

---

## Hooks utilitaires

### 🔄 useTableSort

Hook personnalisé pour gérer le tri des tables.

```tsx
import { useTableSort } from '@/hooks/useTableSort';

const { 
  sortedData,      // Données triées
  sortColumn,      // Colonne de tri actuelle
  sortDirection,   // Direction ('asc' | 'desc')
  handleSort,      // Fonction pour changer le tri
  getSortState     // Fonction pour obtenir l'état de tri d'une colonne
} = useTableSort(data, 'name', 'asc');
```

#### Tri personnalisé

```tsx
// Pour des colonnes avec logique de tri complexe
const { sortedData, handleSort, getSortState } = useTableSort(
  contacts,
  'name',
  'asc'
);

// Le tri par défaut gère :
// - Strings (insensible à la casse)
// - Nombres
// - Valeurs nulles/undefined
// - Conversion automatique en string
```

---

## Standards de design

### Couleurs

#### Primaire (Violet)
- `violet-400` : Éléments interactifs (hover)
- `violet-500` : Bordures, icônes
- `violet-100/900` : Backgrounds de badges

#### Neutres
- `gray-50/900` : Backgrounds (header, cards)
- `gray-200/700` : Bordures, dividers
- `gray-500/400` : Textes secondaires

#### Status
- `green-600/400` : Succès, WhatsApp
- `blue-600/400` : Information, Email
- `red-600/400` : Erreur, suppression

### Espacements

- **Padding des cellules** : `px-4 py-3`
- **Gap entre éléments** : `gap-2` (0.5rem)
- **Marges de section** : `mb-6` (1.5rem)

### Typographie

- **Titres** : `text-lg font-semibold`
- **Texte principal** : `text-sm font-medium`
- **Texte secondaire** : `text-sm text-gray-500 dark:text-gray-400`
- **Labels** : `text-xs font-medium uppercase`

### Transitions

- **Hover** : `transition-colors` ou `transition: background 0.15s ease`
- **Icônes** : `transition-transform hover:scale-110`

### Bordures

- **Photos** : `border border-violet-500`
- **Containers** : `border border-gray-200 dark:border-gray-700`
- **Arrondi** : `rounded-lg` (containers), `rounded-full` (photos)

### Ombres

- **Containers** : `shadow` (élévation légère)
- **Modales** : `shadow-xl` (élévation forte)

---

## Migration vers Table AURA

### Avant

```tsx
<div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="min-w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3">Nom</th>
      </tr>
    </thead>
    <tbody>
      {data.map(item => (
        <tr key={item.id}>
          <td className="px-6 py-4">{item.name}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Après

```tsx
<Table>
  <Table.Head>
    <Table.Row hoverable={false}>
      <Table.HeaderCell>Nom</Table.HeaderCell>
    </Table.Row>
  </Table.Head>
  <Table.Body>
    {data.map(item => (
      <Table.Row key={item.id}>
        <Table.Cell>{item.name}</Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
</Table>
```

### Avantages
✅ Moins de code  
✅ Design unifié automatique  
✅ Mode sombre géré  
✅ Hover et interactions cohérentes  
✅ TypeScript pour éviter les erreurs  

---

## 🚀 Prochaines étapes

Composants à créer :
- [ ] **Select** : Dropdown de sélection stylisé
- [ ] **Checkbox** : Cases à cocher personnalisées
- [ ] **Radio** : Boutons radio personnalisés
- [ ] **DatePicker** : Sélecteur de date
- [ ] **Tabs** : Onglets pour navigation
- [ ] **Breadcrumb** : Fil d'Ariane
- [ ] **Pagination** : Navigation de pages
- [ ] **Skeleton** : Placeholders de chargement
- [ ] **Avatar** : Photos de profil standardisées

---

## 📝 Contribution

Pour ajouter un nouveau composant AURA :

1. Créer le fichier dans `src/components/aura/`
2. Suivre les standards de design (voir ci-dessus)
3. Ajouter le typage TypeScript complet
4. Créer un fichier `.example.tsx` avec des exemples
5. Documenter dans ce README

---

## 📚 Ressources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [React Documentation](https://react.dev/)

---

**Créé avec ❤️ pour Go-Prod AURA**







