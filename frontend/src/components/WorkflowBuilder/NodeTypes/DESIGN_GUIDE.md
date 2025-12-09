# 🎨 Workflow Node Design System

## Professional Design Standard
Design inspired by modern workflow builders.

---

## ✅ Design Principles

### 1. **Consistency**
- **Einheitliche Größe**: 220px × 100px (Standard)
- **Standardisierte Handles**: 3px × 3px, zentriert
- **Konsistente Typografie**: 
  - Label: 14px, semibold
  - Subtitle: 11px, regular
- **Einheitliche Abstände**: 16px padding, 10px gaps

### 2. **Visual Hierarchy**
- **Icon → Label → Subtitle**
- Klare Gewichtung der Informationen
- Subtile Farben für bessere Lesbarkeit

### 3. **Color System**
Kategoriebasierte Farbpalette:

| Category       | Color         | Use Case                          |
|----------------|---------------|-----------------------------------|
| **core**       | Gray          | Start, End                        |
| **ai**         | Indigo/Purple | LLM, Agent, AI-Tools             |
| **logic**      | Amber/Orange  | If/Else, While, Parallel, Merge  |
| **data**       | Blue/Cyan     | Document Upload, Database        |
| **integration**| Green/Emerald | API, Web Search, External        |
| **utility**    | Slate/Zinc    | Tool, Transform, Email           |

---

## 📦 BaseNode Component

### Props
```typescript
interface BaseNodeProps {
  label: string;           // Node name
  icon?: string;           // Emoji icon
  category: 'core' | 'ai' | 'logic' | 'data' | 'integration' | 'utility';
  subtitle?: string;       // Additional info (model, method, etc)
  badge?: string;          // Top-right badge (count, etc)
  status?: 'active' | 'inactive' | 'error' | 'warning';
  hasInput?: boolean;      // Default: true
  hasOutput?: boolean;     // Default: true
  additionalHandles?: Array<HandleConfig>; // For complex nodes
}
```

### Usage Example
```tsx
<BaseNode
  label="LLM"
  icon="🤖"
  category="ai"
  subtitle="gpt-4"
  hasInput={true}
  hasOutput={true}
/>
```

---

## 🎯 Node Categories

### Core Nodes
- **Start**: ▶️ (Entry point)
- **End**: ⬛ (Workflow end)

### AI Nodes
- **LLM**: 🤖 (Language models)
- **Agent**: 👤 (AI agents)

### Logic Nodes
- **If/Else**: ◆ (Conditional branching)
- **While**: 🔁 (Loops)
- **Parallel**: ⚡ (Parallel execution)
- **Merge**: 🔀 (Path merging)

### Data Nodes
- **Document Upload**: 📄
- **Database Query**: 🗄️

### Integration Nodes
- **API Call**: 🌐
- **Web Search**: 🔍
- **Email**: 📧

### Utility Nodes
- **Tool**: 🔧
- **Transform**: 🔄
- **Set State**: 💾

---

## 🔧 Implementation Checklist

### For Simple Nodes (Standard Input/Output):
✅ Use `BaseNode` directly  
✅ Set category correctly  
✅ Choose meaningful icon  
✅ Add subtitle if needed  

### For Complex Nodes (Multiple Handles):
✅ Use `BaseNode` with `additionalHandles`  
✅ Define handle positions explicitly  
✅ Add tooltips if needed  

### For Special Nodes (Custom UI):
✅ Follow BaseNode design patterns  
✅ Use same dimensions (220x100)  
✅ Match color system  
✅ Keep consistent typography  

---

## 🚀 Migration Guide

### Before (Old Style):
```tsx
<div className="px-4 py-3 shadow-lg bg-gradient-to-r from-blue-500 to-purple-500">
  <Handle type="target" position={Position.Top} />
  <div className="font-bold text-white">{label}</div>
  <Handle type="source" position={Position.Bottom} />
</div>
```

### After (New Style):
```tsx
<BaseNode
  label={label}
  icon="🤖"
  category="ai"
  subtitle="Subtitle"
/>
```

---

## 📊 Status

### Converted Nodes (12/26):
- ✅ StartNode
- ✅ EndNode
- ✅ LLMNode
- ✅ AgentNode
- ✅ ParallelNode
- ✅ WebSearchNode
- ✅ DocumentUploadNode
- ✅ IfElseNode (Custom)
- ✅ WhileNode (Custom)
- ✅ ToolNode
- ✅ APINode
- ✅ MergeNode

### Remaining Nodes (14):
- ⏳ CodeInterpreterNode
- ⏳ DatabaseQueryNode
- ⏳ EmailNode
- ⏳ FileSearchNode
- ⏳ GuardrailsNode
- ⏳ ImageGenerationNode
- ⏳ MCPNode
- ⏳ NoteNode
- ⏳ SetStateNode
- ⏳ SpeechToTextNode
- ⏳ TextToSpeechNode
- ⏳ TransformNode
- ⏳ UserApprovalNode

---

## 🎨 Visual Examples

### Standard Node:
```
┌─────────────────────────┐
│  🤖  LLM                │
│      gpt-4              │
└─────────────────────────┘
```

### Node with Badge:
```
┌─────────────────────────┐ [3]
│  ⚡  Parallel            │
│      3 Branches         │
└─────────────────────────┘
```

### Node with Status:
```
┌─────────────────────────┐ ●
│  📄  Document Upload    │
│      file.pdf           │
└─────────────────────────┘
```

---

## 🏆 Quality Standards

### Professional Appearance:
- ✅ Consistent sizing
- ✅ Harmonious colors
- ✅ Clear typography
- ✅ Smooth animations
- ✅ Responsive hover states

### Developer Experience:
- ✅ Easy to use BaseNode
- ✅ Type-safe props
- ✅ Clear documentation
- ✅ Reusable components

---

## 📝 Next Steps

1. **Complete Migration**: Convert all remaining nodes
2. **Add Animations**: Smooth transitions and micro-interactions
3. **Dark Mode**: Support for dark theme
4. **Custom Themes**: Allow color customization
5. **Accessibility**: ARIA labels, keyboard navigation

