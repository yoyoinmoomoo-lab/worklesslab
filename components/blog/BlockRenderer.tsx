"use client";

interface BlockRendererProps {
  blocks: any[];
}

/**
 * Rich text를 React 노드로 변환 (annotation 처리)
 */
function renderRichText(richText: any[]) {
  if (!richText || richText.length === 0) return null;

  return richText.map((text: any, index: number) => {
    const annotations = text.annotations || {};
    let content = text.plain_text || "";

    // Link 처리
    if (text.href) {
      return (
        <a
          key={index}
          href={text.href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600 hover:text-blue-800"
        >
          {content}
        </a>
      );
    }

    // Annotation 스타일 적용
    let element: React.ReactNode = content;

    if (annotations.bold) {
      element = <strong key={index}>{element}</strong>;
    }
    if (annotations.italic) {
      element = <em key={index}>{element}</em>;
    }
    if (annotations.underline) {
      element = <u key={index}>{element}</u>;
    }
    if (annotations.code) {
      element = (
        <code key={index} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
          {element}
        </code>
      );
    }
    if (annotations.color && annotations.color !== "default") {
      element = (
        <span key={index} style={{ color: annotations.color }}>
          {element}
        </span>
      );
    }

    return element;
  });
}

/**
 * 단일 Block을 React 컴포넌트로 렌더링
 */
function renderBlock(block: any) {
  const { type, id } = block;
  const blockContent = block[type];

  switch (type) {
    case "heading_1":
      return (
        <h1 key={id} className="text-3xl font-bold mt-8 mb-4 text-[#222222]">
          {renderRichText(blockContent.rich_text)}
        </h1>
      );

    case "heading_2":
      return (
        <h2 key={id} className="text-2xl font-semibold mt-6 mb-3 text-[#222222]">
          {renderRichText(blockContent.rich_text)}
        </h2>
      );

    case "heading_3":
      return (
        <h3 key={id} className="text-xl font-semibold mt-4 mb-2 text-[#222222]">
          {renderRichText(blockContent.rich_text)}
        </h3>
      );

    case "paragraph":
      return (
        <p key={id} className="mb-4 text-gray-700 leading-relaxed">
          {renderRichText(blockContent.rich_text) || <br />}
        </p>
      );

    case "bulleted_list_item":
      return (
        <li key={id} className="mb-2 ml-6 list-disc text-gray-700">
          {renderRichText(blockContent.rich_text)}
        </li>
      );

    case "numbered_list_item":
      return (
        <li key={id} className="mb-2 ml-6 list-decimal text-gray-700">
          {renderRichText(blockContent.rich_text)}
        </li>
      );

    case "quote":
      return (
        <blockquote
          key={id}
          className="border-l-4 border-gray-300 pl-4 py-2 my-4 italic text-gray-600"
        >
          {renderRichText(blockContent.rich_text)}
        </blockquote>
      );

    case "code":
      const codeText = blockContent.rich_text
        ?.map((t: any) => t.plain_text)
        .join("") || "";
      const language = blockContent.language || "";
      return (
        <pre
          key={id}
          className="bg-gray-100 rounded-lg p-4 my-4 overflow-x-auto"
        >
          <code className={`text-sm font-mono ${language ? `language-${language}` : ""}`}>
            {codeText}
          </code>
        </pre>
      );

    case "divider":
      return <hr key={id} className="my-6 border-gray-300" />;

    case "image":
      // 이미지는 optional - 스킵
      return null;

    default:
      // 알 수 없는 타입은 스킵
      return null;
  }
}

/**
 * Block Renderer 메인 컴포넌트
 */
export default function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-gray-500">내용이 없습니다.</p>;
  }

  // 리스트 아이템들을 그룹화하여 ul/ol로 감싸기
  const renderedBlocks: React.ReactNode[] = [];
  let currentList: any[] = [];
  let currentListType: "bulleted" | "numbered" | null = null;

  blocks.forEach((block) => {
    const { type } = block;

    if (type === "bulleted_list_item") {
      if (currentListType !== "bulleted" && currentList.length > 0) {
        // 이전 리스트 종료
        renderedBlocks.push(
          currentListType === "numbered" ? (
            <ol key={`list-${renderedBlocks.length}`} className="mb-4">
              {currentList.map((item) => renderBlock(item))}
            </ol>
          ) : (
            <ul key={`list-${renderedBlocks.length}`} className="mb-4">
              {currentList.map((item) => renderBlock(item))}
            </ul>
          )
        );
        currentList = [];
      }
      currentList.push(block);
      currentListType = "bulleted";
    } else if (type === "numbered_list_item") {
      if (currentListType !== "numbered" && currentList.length > 0) {
        // 이전 리스트 종료
        renderedBlocks.push(
          currentListType === "bulleted" ? (
            <ul key={`list-${renderedBlocks.length}`} className="mb-4">
              {currentList.map((item) => renderBlock(item))}
            </ul>
          ) : (
            <ol key={`list-${renderedBlocks.length}`} className="mb-4">
              {currentList.map((item) => renderBlock(item))}
            </ol>
          )
        );
        currentList = [];
      }
      currentList.push(block);
      currentListType = "numbered";
    } else {
      // 리스트가 아닌 블록이 나오면 이전 리스트 종료
      if (currentList.length > 0) {
        renderedBlocks.push(
          currentListType === "numbered" ? (
            <ol key={`list-${renderedBlocks.length}`} className="mb-4">
              {currentList.map((item) => renderBlock(item))}
            </ol>
          ) : (
            <ul key={`list-${renderedBlocks.length}`} className="mb-4">
              {currentList.map((item) => renderBlock(item))}
            </ul>
          )
        );
        currentList = [];
        currentListType = null;
      }
      // 일반 블록 렌더링
      const rendered = renderBlock(block);
      if (rendered) {
        renderedBlocks.push(rendered);
      }
    }
  });

  // 마지막 리스트 처리
  if (currentList.length > 0) {
    renderedBlocks.push(
      currentListType === "numbered" ? (
        <ol key={`list-${renderedBlocks.length}`} className="mb-4">
          {currentList.map((item) => renderBlock(item))}
        </ol>
      ) : (
        <ul key={`list-${renderedBlocks.length}`} className="mb-4">
          {currentList.map((item) => renderBlock(item))}
        </ul>
      )
    );
  }

  return <div className="blog-content">{renderedBlocks}</div>;
}

