import React, { useState } from 'react';
import { Chapter } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronRight, ChevronDown, BookOpen } from 'lucide-react';

interface ChapterTreeProps {
  chapters: Chapter[];
  currentChapter: Chapter;
  onSelectChapter: (chapterId: number) => void;
}

interface ChapterNode {
  chapter: Chapter;
  children: ChapterNode[];
}

/**
 * Baut eine Baumstruktur aus Kapiteln auf
 */
function buildChapterTree(chapters: Chapter[]): ChapterNode[] {
  const rootNodes: ChapterNode[] = [];
  const nodeMap = new Map<number, ChapterNode>();

  // Zuerst alle Knoten erstellen
  chapters.forEach(chapter => {
    const node: ChapterNode = {
      chapter,
      children: []
    };
    nodeMap.set(chapter.id, node);
  });

  // Dann die Beziehungen aufbauen
  chapters.forEach(chapter => {
    const node = nodeMap.get(chapter.id);
    if (node) {
      if (chapter.parentId) {
        const parentNode = nodeMap.get(chapter.parentId);
        if (parentNode) {
          parentNode.children.push(node);
        }
      } else {
        // Root-Knoten haben keine Eltern
        rootNodes.push(node);
      }
    }
  });

  return rootNodes;
}

/**
 * Rekursive Komponente für einen Baumknoten
 */
const TreeNode: React.FC<{
  node: ChapterNode;
  currentChapterId: number;
  level: number;
  onSelectChapter: (chapterId: number) => void;
}> = ({ node, currentChapterId, level, onSelectChapter }) => {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  const hasChildren = node.children.length > 0;
  const isActive = node.chapter.id === currentChapterId;

  // Berechne Padding basierend auf der Ebene
  const indentStyle = {
    paddingLeft: `${level * (isMobile ? 12 : 16)}px`
  };

  return (
    <div className="chapter-node">
      <div 
        className={cn(
          "flex items-center py-1.5 hover:bg-gray-100 rounded transition-colors cursor-pointer",
          isActive && "bg-primary/10 font-medium"
        )}
        style={indentStyle}
        onClick={() => onSelectChapter(node.chapter.id)}
      >
        {hasChildren ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 p-0 mr-1"
            onClick={(e) => { 
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />
            }
          </Button>
        ) : (
          <BookOpen className="h-4 w-4 ml-1 mr-2 text-gray-500" />
        )}
        <span className="truncate">{node.chapter.title}</span>
      </div>
      
      {expanded && hasChildren && (
        <div className="children">
          {node.children.map(childNode => (
            <TreeNode
              key={childNode.chapter.id}
              node={childNode}
              currentChapterId={currentChapterId}
              level={level + 1}
              onSelectChapter={onSelectChapter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ChapterTree({ chapters, currentChapter, onSelectChapter }: ChapterTreeProps) {
  const treeNodes = buildChapterTree(chapters);

  return (
    <div className="chapter-tree overflow-y-auto max-h-[70vh]">
      <h3 className="font-medium text-sm mb-2">Kapitelstruktur</h3>
      <Separator className="mb-2" />
      
      {treeNodes.map(node => (
        <TreeNode
          key={node.chapter.id}
          node={node}
          currentChapterId={currentChapter.id}
          level={0}
          onSelectChapter={onSelectChapter}
        />
      ))}
    </div>
  );
}