import ts from 'typescript';
/** Build-only transformations for one pure module; no secrets or authorization logic. */
export function protectBookingSelection(source,filename){
 const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,noResolve:true,noLib:true};
 const host=ts.createCompilerHost(options);const originalGet=host.getSourceFile.bind(host);
 host.getSourceFile=(file,...args)=>file===filename?ts.createSourceFile(filename,source,ts.ScriptTarget.ES2022,true):originalGet(file,...args);
 const program=ts.createProgram([filename],options,host),file=program.getSourceFile(filename),checker=program.getTypeChecker();
 if(!file)throw new Error('Protection target missing');
 const locals=new Map();let serial=0;
 function inTarget(node){for(let parent=node.parent;parent;parent=parent.parent)if(ts.isMethodDeclaration(parent))return ['contiguous','select'].includes(parent.name.getText(file));return false;}
 function collect(node){if((ts.isVariableDeclaration(node)||ts.isParameter(node))&&ts.isIdentifier(node.name)&&inTarget(node)){const symbol=checker.getSymbolAtLocation(node.name);if(symbol&&!locals.has(symbol))locals.set(symbol,'_r'+serial++);}ts.forEachChild(node,collect);}
 collect(file);
 const data=[];const encoded=new Map();
 const transformed=ts.transform(file,[context=>{
  const f=context.factory;
  function rename(node){
   if(ts.isShorthandPropertyAssignment(node)){const symbol=checker.getShorthandAssignmentValueSymbol(node);if(locals.has(symbol))return f.createPropertyAssignment(node.name.text,f.createIdentifier(locals.get(symbol)));}
   if(ts.isIdentifier(node)){const symbol=checker.getSymbolAtLocation(node);if(locals.has(symbol))return f.createIdentifier(locals.get(symbol));}
   return ts.visitEachChild(node,rename,context);
  }
  function hide(node){
   if(ts.isStringLiteral(node)&&!ts.isImportDeclaration(node.parent)&&!ts.isExportDeclaration(node.parent)&&!(ts.isLiteralTypeNode(node.parent))){
    if(ts.isPropertyAssignment(node.parent)&&node.parent.name===node)return node;
    let index=encoded.get(node.text);if(index===undefined){index=data.length;encoded.set(node.text,index);data.push(Array.from({length:node.text.length},(_,i)=>node.text.charCodeAt(i)^91));}
    return f.createCallExpression(f.createIdentifier('_rbDecode'),undefined,[f.createNumericLiteral(index)]);
   }
   return ts.visitEachChild(node,hide,context);
  }
  function flatten(node){
   if(ts.isMethodDeclaration(node)&&node.body&&ts.isIdentifier(node.name)&&['contiguous','select'].includes(node.name.text)){
    const original=[...node.body.statements];if(!ts.isReturnStatement(original.at(-1)))throw new Error('Unsupported protection target shape');
    const hoisted=[];
    const groups=original.map(statement=>{
     if(!ts.isVariableStatement(statement))return [statement];
     return statement.declarationList.declarations.flatMap(declaration=>{
      if(!ts.isIdentifier(declaration.name))throw new Error('Unsupported destructuring in protection target');
      hoisted.push(f.createVariableDeclaration(declaration.name));
      return declaration.initializer?[f.createExpressionStatement(f.createBinaryExpression(declaration.name,f.createToken(ts.SyntaxKind.EqualsToken),declaration.initializer))]:[];
     });
    });
    const cases=groups.map((statements,index)=>f.createCaseClause(f.createNumericLiteral((index+1)*37),[...statements,
     f.createExpressionStatement(f.createBinaryExpression(f.createIdentifier('_rbState'),f.createToken(ts.SyntaxKind.EqualsToken),f.createNumericLiteral((index+2)*37))),f.createBreakStatement()]));
    const body=f.createBlock([
     ...(hoisted.length?[f.createVariableStatement(undefined,f.createVariableDeclarationList(hoisted,ts.NodeFlags.Let))]:[]),
     f.createVariableStatement(undefined,f.createVariableDeclarationList([f.createVariableDeclaration('_rbState',undefined,undefined,f.createNumericLiteral(37))],ts.NodeFlags.Let)),
     f.createWhileStatement(f.createTrue(),f.createBlock([f.createSwitchStatement(f.createIdentifier('_rbState'),f.createCaseBlock(cases.reverse()))],true))
    ],true);
    return f.updateMethodDeclaration(node,node.modifiers,node.asteriskToken,node.name,node.questionToken,node.typeParameters,node.parameters,node.type,body);
   }
   return ts.visitEachChild(node,flatten,context);
  }
  return root=>flatten(hide(rename(root)));
 }]);
 const printed=ts.createPrinter({removeComments:true}).printFile(transformed.transformed[0]);transformed.dispose();
 return `const _rbData=${JSON.stringify(data)};function _rbDecode(i){return String.fromCharCode(..._rbData[i].map(n=>n^91));}\n`+printed;
}
