import { Text, View, StyleSheet } from "react-native";

// Componente para renderizar el texto parseado
export const RenderMarkdownText = ({ text }) => {
  const parseMarkdownText = (text) => {
    if (!text) return [];
  
    // Dividir por líneas
    const lines = text.split('\n');
    const elements = [];
  
    lines.forEach((line, index) => {
      // Títulos con ##
      if (line.startsWith('## ')) {
        elements.push({
          type: 'title',
          content: line.replace(/^##\s*/, ''),
          key: index
        });
      }
      // Viñeta con negrita (* **texto**)
      else if (line.startsWith('* **')) {
        const content = line.replace(/^\*\s*/, ''); // quitar "* "
        const parts = content.split(/\*\*(.*?)\*\*/g); // detectar bold
        const lineElements = [];
        
        parts.forEach((part, i) => {
          if (i % 2 === 0) {
            if (part.trim()) lineElements.push({ type: 'text', content: part });
          } else {
            lineElements.push({ type: 'bold', content: part });
          }
        });

        elements.push({
          type: 'bullet',
          content: lineElements,
          key: index
        });
      }
      // Negritas en párrafos normales
      else if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const lineElements = [];
        
        parts.forEach((part, i) => {
          if (i % 2 === 0) {
            if (part.trim()) lineElements.push({ type: 'text', content: part });
          } else {
            lineElements.push({ type: 'bold', content: part });
          }
        });
        
        elements.push({
          type: 'paragraph',
          content: lineElements,
          key: index
        });
      }
      // Viñetas con * al inicio
      else if (line.trim().startsWith('* ')) {
        elements.push({
          type: 'bullet',
          content: [{ type: 'text', content: line.replace(/^\s*\*\s*/, '') }],
          key: index
        });
      }
      // Párrafos normales
      else if (line.trim()) {
        elements.push({
          type: 'paragraph',
          content: [{ type: 'text', content: line }],
          key: index
        });
      }
    });
  
    return elements;
  };

  const elements = parseMarkdownText(text);

  return (
    <View>
      {elements.map((element) => {
        switch (element.type) {
          case 'title':
            return (
              <Text key={element.key} style={styles.markdownTitle}>
                {element.content}
              </Text>
            );
          case 'bullet':
            return (
              <View key={element.key} style={styles.bulletContainer}>
                <Text style={styles.bulletPoint}>• </Text>
                <Text style={styles.bulletText}>
                  {element.content.map((part, i) => (
                    <Text
                      key={i}
                      style={part.type === 'bold' ? styles.boldText : null}
                    >
                      {part.content}
                    </Text>
                  ))}
                </Text>
              </View>
            );
          case 'paragraph':
            return (
              <Text key={element.key} style={styles.markdownParagraph}>
                {element.content.map((part, i) => (
                  <Text
                    key={i}
                    style={part.type === 'bold' ? styles.boldText : null}
                  >
                    {part.content}
                  </Text>
                ))}
              </Text>
            );
          default:
            return null;
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  markdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  markdownParagraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
    marginBottom: 8,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#222',
  },
  bulletContainer: {
    flexDirection: 'row',
    marginLeft: 8,
    marginBottom: 6,
    paddingRight: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#6200EE',
    marginRight: 4,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
    flex: 1,
  },
});
