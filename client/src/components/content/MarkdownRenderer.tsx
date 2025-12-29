import ReactMarkdown from "react-markdown";
import { Components } from "react-markdown";
import { cn } from "@/lib/utils";
import parse, { DOMNode, Element, domToReact } from 'html-react-parser';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // HTML 콘텐츠인지 Markdown인지 자동 감지
  const isHTML = content.trim().startsWith('<');

  // HTML 콘텐츠인 경우 HTML 파서 사용
  if (isHTML) {
    const options = {
      replace: (domNode: DOMNode) => {
        if (domNode instanceof Element && domNode.type === 'tag') {
          const { name, attribs, children } = domNode;

          // H2 스타일링
          if (name === 'h2') {
            return (
              <h2 className={cn(
                "text-white text-xl font-bold bg-primary px-4 py-3 rounded-lg mt-8 mb-4",
                "first:mt-0"
              )}>
                {domToReact(children as DOMNode[], options)}
              </h2>
            );
          }

          // H3 스타일링
          if (name === 'h3') {
            return (
              <h3 className="text-lg font-bold text-foreground mt-6 mb-3">
                {domToReact(children as DOMNode[], options)}
              </h3>
            );
          }

          // H4 스타일링
          if (name === 'h4') {
            return (
              <h4 className="text-base font-semibold text-foreground mt-4 mb-2">
                {domToReact(children as DOMNode[], options)}
              </h4>
            );
          }

          // 문단 스타일링
          if (name === 'p') {
            return (
              <p className="text-base leading-relaxed mb-4 text-foreground">
                {domToReact(children as DOMNode[], options)}
              </p>
            );
          }

          // 리스트 스타일링
          if (name === 'ul') {
            return (
              <ul className="list-disc list-inside space-y-2 mb-4 pl-4">
                {domToReact(children as DOMNode[], options)}
              </ul>
            );
          }

          if (name === 'ol') {
            return (
              <ol className="list-decimal list-inside space-y-2 mb-4 pl-4">
                {domToReact(children as DOMNode[], options)}
              </ol>
            );
          }

          if (name === 'li') {
            return (
              <li className="text-base leading-relaxed text-foreground">
                {domToReact(children as DOMNode[], options)}
              </li>
            );
          }

          // 강조 스타일링
          if (name === 'strong') {
            return (
              <strong className="font-bold text-foreground">
                {domToReact(children as DOMNode[], options)}
              </strong>
            );
          }

          if (name === 'em') {
            return (
              <em className="italic text-foreground">
                {domToReact(children as DOMNode[], options)}
              </em>
            );
          }

          // 링크 스타일링
          if (name === 'a') {
            return (
              <a
                className="text-primary hover:underline font-medium"
                href={attribs.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {domToReact(children as DOMNode[], options)}
              </a>
            );
          }

          // 테이블 스타일링
          if (name === 'table') {
            return (
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full border-collapse border border-border">
                  {domToReact(children as DOMNode[], options)}
                </table>
              </div>
            );
          }

          if (name === 'thead') {
            return (
              <thead className="bg-secondary">
                {domToReact(children as DOMNode[], options)}
              </thead>
            );
          }

          if (name === 'th') {
            return (
              <th className="border border-border px-4 py-2 text-left font-semibold">
                {domToReact(children as DOMNode[], options)}
              </th>
            );
          }

          if (name === 'td') {
            return (
              <td className="border border-border px-4 py-2">
                {domToReact(children as DOMNode[], options)}
              </td>
            );
          }

          // 이미지 최적화
          if (name === 'img') {
            return (
              <img
                src={attribs.src}
                alt={attribs.alt || ''}
                className={cn("w-full h-auto rounded-lg my-6", attribs.class)}
                loading="lazy"
              />
            );
          }

          // DL/DT/DD (FAQ 등)
          if (name === 'dl') {
            return (
              <dl className="space-y-4 mb-6">
                {domToReact(children as DOMNode[], options)}
              </dl>
            );
          }

          if (name === 'dt') {
            return (
              <dt className="font-bold text-lg text-foreground mt-4">
                {domToReact(children as DOMNode[], options)}
              </dt>
            );
          }

          if (name === 'dd') {
            return (
              <dd className="text-base text-muted-foreground ml-4 mt-2">
                {domToReact(children as DOMNode[], options)}
              </dd>
            );
          }
        }
      }
    };

    return (
      <div className={cn("prose prose-lg dark:prose-invert max-w-none", className)}>
        {parse(content, options)}
      </div>
    );
  }
  // 헤딩 ID 생성 함수
  const generateHeadingId = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-가-힣]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // 커스텀 컴포넌트 정의
  const components: Components = {
    // H2 스타일링 (빨간 배경, 흰색 텍스트)
    h2: ({ node, children, ...props }) => {
      const text = String(children);
      const id = generateHeadingId(text);
      
      return (
        <h2
          id={id}
          className={cn(
            "text-white text-xl font-bold bg-primary px-4 py-3 rounded-lg mt-8 mb-4",
            "first:mt-0"
          )}
          {...props}
        >
          {children}
        </h2>
      );
    },
    
    // H3 스타일링
    h3: ({ node, children, ...props }) => {
      const text = String(children);
      const id = generateHeadingId(text);
      
      return (
        <h3
          id={id}
          className="text-lg font-bold text-foreground mt-6 mb-3"
          {...props}
        >
          {children}
        </h3>
      );
    },
    
    // H4 스타일링
    h4: ({ node, children, ...props }) => {
      const text = String(children);
      const id = generateHeadingId(text);
      
      return (
        <h4
          id={id}
          className="text-base font-semibold text-foreground mt-4 mb-2"
          {...props}
        >
          {children}
        </h4>
      );
    },
    
    // 문단 스타일링
    p: ({ node, children, ...props }) => {
      return (
        <p className="text-base leading-relaxed mb-4 text-foreground" {...props}>
          {children}
        </p>
      );
    },
    
    // 리스트 스타일링
    ul: ({ node, children, ...props }) => {
      return (
        <ul className="list-disc list-inside space-y-2 mb-4 pl-4" {...props}>
          {children}
        </ul>
      );
    },
    
    ol: ({ node, children, ...props }) => {
      return (
        <ol className="list-decimal list-inside space-y-2 mb-4 pl-4" {...props}>
          {children}
        </ol>
      );
    },
    
    li: ({ node, children, ...props }) => {
      return (
        <li className="text-base leading-relaxed text-foreground" {...props}>
          {children}
        </li>
      );
    },
    
    // 강조 스타일링
    strong: ({ node, children, ...props }) => {
      return (
        <strong className="font-bold text-foreground" {...props}>
          {children}
        </strong>
      );
    },
    
    em: ({ node, children, ...props }) => {
      return (
        <em className="italic text-foreground" {...props}>
          {children}
        </em>
      );
    },
    
    // 링크 스타일링
    a: ({ node, children, ...props }) => {
      return (
        <a
          className="text-primary hover:underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      );
    },
    
    // 코드 블록 스타일링
    code: ({ node, className, children, ...props }) => {
      const inline = !className?.includes('language-');
      if (inline) {
        return (
          <code
            className="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          className="block bg-secondary p-4 rounded-lg overflow-x-auto text-sm font-mono text-foreground mb-4"
          {...props}
        >
          {children}
        </code>
      );
    },
    
    // 인용구 스타일링
    blockquote: ({ node, children, ...props }) => {
      return (
        <blockquote
          className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
  };

  return (
    <div className={cn("prose prose-lg dark:prose-invert max-w-none", className)}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

