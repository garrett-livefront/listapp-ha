/*!
 * listapp-list-card — ListApp list card for Home Assistant.
 * Source and licences: https://github.com/garrett-livefront/listapp-ha (frontend/, NOTICE)
 * Bundles lit 3.3.3 (BSD-3-Clause) and icon paths from lucide (ISC).
 */
var Oe=Object.defineProperty;var Ve=Object.getOwnPropertyDescriptor;var v=(s,e,t,i)=>{for(var r=i>1?void 0:i?Ve(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(r=(i?o(e,t,r):o(r))||r);return i&&r&&Oe(e,t,r),r};var st=globalThis,rt=st.ShadowRoot&&(st.ShadyCSS===void 0||st.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,bt=Symbol(),Lt=new WeakMap,q=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==bt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(rt&&e===void 0){let i=t!==void 0&&t.length===1;i&&(e=Lt.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&Lt.set(t,e))}return e}toString(){return this.cssText}},Nt=s=>new q(typeof s=="string"?s:s+"",void 0,bt),K=(s,...e)=>{let t=s.length===1?s[0]:e.reduce((i,r,n)=>i+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+s[n+1],s[0]);return new q(t,s,bt)},Ot=(s,e)=>{if(rt)s.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let i=document.createElement("style"),r=st.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=t.cssText,s.appendChild(i)}},yt=rt?s=>s:s=>s instanceof CSSStyleSheet?(e=>{let t="";for(let i of e.cssRules)t+=i.cssText;return Nt(t)})(s):s;var{is:ze,defineProperty:Be,getOwnPropertyDescriptor:Fe,getOwnPropertyNames:je,getOwnPropertySymbols:Ge,getPrototypeOf:qe}=Object,nt=globalThis,Vt=nt.trustedTypes,Ke=Vt?Vt.emptyScript:"",We=nt.reactiveElementPolyfillSupport,W=(s,e)=>s,Y={toAttribute(s,e){switch(e){case Boolean:s=s?Ke:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,e){let t=s;switch(e){case Boolean:t=s!==null;break;case Number:t=s===null?null:Number(s);break;case Object:case Array:try{t=JSON.parse(s)}catch{t=null}}return t}},ot=(s,e)=>!ze(s,e),zt={attribute:!0,type:String,converter:Y,reflect:!1,useDefault:!1,hasChanged:ot};Symbol.metadata??=Symbol("metadata"),nt.litPropertyMetadata??=new WeakMap;var k=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=zt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let i=Symbol(),r=this.getPropertyDescriptor(e,i,t);r!==void 0&&Be(this.prototype,e,r)}}static getPropertyDescriptor(e,t,i){let{get:r,set:n}=Fe(this.prototype,e)??{get(){return this[t]},set(o){this[t]=o}};return{get:r,set(o){let a=r?.call(this);n?.call(this,o),this.requestUpdate(e,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??zt}static _$Ei(){if(this.hasOwnProperty(W("elementProperties")))return;let e=qe(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(W("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(W("properties"))){let t=this.properties,i=[...je(t),...Ge(t)];for(let r of i)this.createProperty(r,t[r])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[i,r]of t)this.elementProperties.set(i,r)}this._$Eh=new Map;for(let[t,i]of this.elementProperties){let r=this._$Eu(t,i);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let i=new Set(e.flat(1/0).reverse());for(let r of i)t.unshift(yt(r))}else e!==void 0&&t.push(yt(e));return t}static _$Eu(e,t){let i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ot(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){let i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(r!==void 0&&i.reflect===!0){let n=(i.converter?.toAttribute!==void 0?i.converter:Y).toAttribute(t,i.type);this._$Em=e,n==null?this.removeAttribute(r):this.setAttribute(r,n),this._$Em=null}}_$AK(e,t){let i=this.constructor,r=i._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let n=i.getPropertyOptions(r),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:Y;this._$Em=r;let a=o.fromAttribute(t,n.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,i,r=!1,n){if(e!==void 0){let o=this.constructor;if(r===!1&&(n=this[e]),i??=o.getPropertyOptions(e),!((i.hasChanged??ot)(n,t)||i.useDefault&&i.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,i))))return;this.C(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:r,wrapped:n},o){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),n!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,n]of this._$Ep)this[r]=n;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[r,n]of i){let{wrapped:o}=n,a=this[r];o!==!0||this._$AL.has(r)||a===void 0||this.C(r,void 0,n,a)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};k.elementStyles=[],k.shadowRootOptions={mode:"open"},k[W("elementProperties")]=new Map,k[W("finalized")]=new Map,We?.({ReactiveElement:k}),(nt.reactiveElementVersions??=[]).push("2.1.2");var $t=globalThis,Bt=s=>s,at=$t.trustedTypes,Ft=at?at.createPolicy("lit-html",{createHTML:s=>s}):void 0,wt="$lit$",S=`lit$${Math.random().toFixed(9).slice(2)}$`,At="?"+S,Ye=`<${At}>`,D=document,J=()=>D.createComment(""),Q=s=>s===null||typeof s!="object"&&typeof s!="function",Et=Array.isArray,Yt=s=>Et(s)||typeof s?.[Symbol.iterator]=="function",xt=`[ 	
\f\r]`,Z=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,jt=/-->/g,Gt=/>/g,P=RegExp(`>|${xt}(?:([^\\s"'>=/]+)(${xt}*=${xt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),qt=/'/g,Kt=/"/g,Zt=/^(?:script|style|textarea|title)$/i,Tt=s=>(e,...t)=>({_$litType$:s,strings:e,values:t}),p=Tt(1),Jt=Tt(2),Pi=Tt(3),b=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),Wt=new WeakMap,H=D.createTreeWalker(D,129);function Qt(s,e){if(!Et(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return Ft!==void 0?Ft.createHTML(e):e}var Xt=(s,e)=>{let t=s.length-1,i=[],r,n=e===2?"<svg>":e===3?"<math>":"",o=Z;for(let a=0;a<t;a++){let l=s[a],u,_,c=-1,g=0;for(;g<l.length&&(o.lastIndex=g,_=o.exec(l),_!==null);)g=o.lastIndex,o===Z?_[1]==="!--"?o=jt:_[1]!==void 0?o=Gt:_[2]!==void 0?(Zt.test(_[2])&&(r=RegExp("</"+_[2],"g")),o=P):_[3]!==void 0&&(o=P):o===P?_[0]===">"?(o=r??Z,c=-1):_[1]===void 0?c=-2:(c=o.lastIndex-_[2].length,u=_[1],o=_[3]===void 0?P:_[3]==='"'?Kt:qt):o===Kt||o===qt?o=P:o===jt||o===Gt?o=Z:(o=P,r=void 0);let m=o===P&&s[a+1].startsWith("/>")?" ":"";n+=o===Z?l+Ye:c>=0?(i.push(u),l.slice(0,c)+wt+l.slice(c)+S+m):l+S+(c===-2?a:m)}return[Qt(s,n+(s[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]},X=class s{constructor({strings:e,_$litType$:t},i){let r;this.parts=[];let n=0,o=0,a=e.length-1,l=this.parts,[u,_]=Xt(e,t);if(this.el=s.createElement(u,i),H.currentNode=this.el.content,t===2||t===3){let c=this.el.content.firstChild;c.replaceWith(...c.childNodes)}for(;(r=H.nextNode())!==null&&l.length<a;){if(r.nodeType===1){if(r.hasAttributes())for(let c of r.getAttributeNames())if(c.endsWith(wt)){let g=_[o++],m=r.getAttribute(c).split(S),f=/([.?@])?(.*)/.exec(g);l.push({type:1,index:n,name:f[2],strings:m,ctor:f[1]==="."?dt:f[1]==="?"?ct:f[1]==="@"?ht:L}),r.removeAttribute(c)}else c.startsWith(S)&&(l.push({type:6,index:n}),r.removeAttribute(c));if(Zt.test(r.tagName)){let c=r.textContent.split(S),g=c.length-1;if(g>0){r.textContent=at?at.emptyScript:"";for(let m=0;m<g;m++)r.append(c[m],J()),H.nextNode(),l.push({type:2,index:++n});r.append(c[g],J())}}}else if(r.nodeType===8)if(r.data===At)l.push({type:2,index:n});else{let c=-1;for(;(c=r.data.indexOf(S,c+1))!==-1;)l.push({type:7,index:n}),c+=S.length-1}n++}}static createElement(e,t){let i=D.createElement("template");return i.innerHTML=e,i}};function U(s,e,t=s,i){if(e===b)return e;let r=i!==void 0?t._$Co?.[i]:t._$Cl,n=Q(e)?void 0:e._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),n===void 0?r=void 0:(r=new n(s),r._$AT(s,t,i)),i!==void 0?(t._$Co??=[])[i]=r:t._$Cl=r),r!==void 0&&(e=U(s,r._$AS(s,e.values),r,i)),e}var lt=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:i}=this._$AD,r=(e?.creationScope??D).importNode(t,!0);H.currentNode=r;let n=H.nextNode(),o=0,a=0,l=i[0];for(;l!==void 0;){if(o===l.index){let u;l.type===2?u=new z(n,n.nextSibling,this,e):l.type===1?u=new l.ctor(n,l.name,l.strings,this,e):l.type===6&&(u=new pt(n,this,e)),this._$AV.push(u),l=i[++a]}o!==l?.index&&(n=H.nextNode(),o++)}return H.currentNode=D,r}p(e){let t=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}},z=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,r){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=U(this,e,t),Q(e)?e===h||e==null||e===""?(this._$AH!==h&&this._$AR(),this._$AH=h):e!==this._$AH&&e!==b&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Yt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==h&&Q(this._$AH)?this._$AA.nextSibling.data=e:this.T(D.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:i}=e,r=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=X.createElement(Qt(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(t);else{let n=new lt(r,this),o=n.u(this.options);n.p(t),this.T(o),this._$AH=n}}_$AC(e){let t=Wt.get(e.strings);return t===void 0&&Wt.set(e.strings,t=new X(e)),t}k(e){Et(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,i,r=0;for(let n of e)r===t.length?t.push(i=new s(this.O(J()),this.O(J()),this,this.options)):i=t[r],i._$AI(n),r++;r<t.length&&(this._$AR(i&&i._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let i=Bt(e).nextSibling;Bt(e).remove(),e=i}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},L=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,r,n){this.type=1,this._$AH=h,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=h}_$AI(e,t=this,i,r){let n=this.strings,o=!1;if(n===void 0)e=U(this,e,t,0),o=!Q(e)||e!==this._$AH&&e!==b,o&&(this._$AH=e);else{let a=e,l,u;for(e=n[0],l=0;l<n.length-1;l++)u=U(this,a[i+l],t,l),u===b&&(u=this._$AH[l]),o||=!Q(u)||u!==this._$AH[l],u===h?e=h:e!==h&&(e+=(u??"")+n[l+1]),this._$AH[l]=u}o&&!r&&this.j(e)}j(e){e===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},dt=class extends L{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===h?void 0:e}},ct=class extends L{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==h)}},ht=class extends L{constructor(e,t,i,r,n){super(e,t,i,r,n),this.type=5}_$AI(e,t=this){if((e=U(this,e,t,0)??h)===b)return;let i=this._$AH,r=e===h&&i!==h||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,n=e!==h&&(i===h||r);r&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},pt=class{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){U(this,e)}},te={M:wt,P:S,A:At,C:1,L:Xt,R:lt,D:Yt,V:U,I:z,H:L,N:ct,U:ht,B:dt,F:pt},Ze=$t.litHtmlPolyfillSupport;Ze?.(X,z),($t.litHtmlVersions??=[]).push("3.3.3");var ee=(s,e,t)=>{let i=t?.renderBefore??e,r=i._$litPart$;if(r===void 0){let n=t?.renderBefore??null;i._$litPart$=r=new z(e.insertBefore(J(),n),n,void 0,t??{})}return r._$AI(s),r};var Ct=globalThis,E=class extends k{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=ee(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return b}};E._$litElement$=!0,E.finalized=!0,Ct.litElementHydrateSupport?.({LitElement:E});var Je=Ct.litElementPolyfillSupport;Je?.({LitElement:E});(Ct.litElementVersions??=[]).push("4.2.2");var Qe={attribute:!0,type:String,converter:Y,reflect:!1,hasChanged:ot},Xe=(s=Qe,e,t)=>{let{kind:i,metadata:r}=t,n=globalThis.litPropertyMetadata.get(r);if(n===void 0&&globalThis.litPropertyMetadata.set(r,n=new Map),i==="setter"&&((s=Object.create(s)).wrapped=!0),n.set(t.name,s),i==="accessor"){let{name:o}=t;return{set(a){let l=e.get.call(this);e.set.call(this,a),this.requestUpdate(o,l,s,!0,a)},init(a){return a!==void 0&&this.C(o,void 0,s,a),a}}}if(i==="setter"){let{name:o}=t;return function(a){let l=this[o];e.call(this,a),this.requestUpdate(o,l,s,!0,a)}}throw Error("Unsupported decorator location: "+i)};function B(s){return(e,t)=>typeof t=="object"?Xe(s,e,t):((i,r,n)=>{let o=r.hasOwnProperty(n);return r.constructor.createProperty(n,i),o?Object.getOwnPropertyDescriptor(r,n):void 0})(s,e,t)}function y(s){return B({...s,state:!0,attribute:!1})}var I={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},C=s=>(...e)=>({_$litDirective$:s,values:e}),T=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var tt=C(class extends T{constructor(s){if(super(s),s.type!==I.ATTRIBUTE||s.name!=="class"||s.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(s){return" "+Object.keys(s).filter(e=>s[e]).join(" ")+" "}update(s,[e]){if(this.st===void 0){this.st=new Set,s.strings!==void 0&&(this.nt=new Set(s.strings.join(" ").split(/\s/).filter(i=>i!=="")));for(let i in e)e[i]&&!this.nt?.has(i)&&this.st.add(i);return this.render(e)}let t=s.element.classList;for(let i of this.st)i in e||(t.remove(i),this.st.delete(i));for(let i in e){let r=!!e[i];r===this.st.has(i)||this.nt?.has(i)||(r?(t.add(i),this.st.add(i)):(t.remove(i),this.st.delete(i)))}return b}});var{I:ti}=te,ie=s=>s;var se=()=>document.createComment(""),F=(s,e,t)=>{let i=s._$AA.parentNode,r=e===void 0?s._$AB:e._$AA;if(t===void 0){let n=i.insertBefore(se(),r),o=i.insertBefore(se(),r);t=new ti(n,o,s,s.options)}else{let n=t._$AB.nextSibling,o=t._$AM,a=o!==s;if(a){let l;t._$AQ?.(s),t._$AM=s,t._$AP!==void 0&&(l=s._$AU)!==o._$AU&&t._$AP(l)}if(n!==r||a){let l=t._$AA;for(;l!==n;){let u=ie(l).nextSibling;ie(i).insertBefore(l,r),l=u}}}return t},R=(s,e,t=s)=>(s._$AI(e,t),s),ei={},re=(s,e=ei)=>s._$AH=e,ne=s=>s._$AH,mt=s=>{s._$AR(),s._$AA.remove()};var oe=(s,e,t)=>{let i=new Map;for(let r=e;r<=t;r++)i.set(s[r],r);return i},ae=C(class extends T{constructor(s){if(super(s),s.type!==I.CHILD)throw Error("repeat() can only be used in text expressions")}dt(s,e,t){let i;t===void 0?t=e:e!==void 0&&(i=e);let r=[],n=[],o=0;for(let a of s)r[o]=i?i(a,o):o,n[o]=t(a,o),o++;return{values:n,keys:r}}render(s,e,t){return this.dt(s,e,t).values}update(s,[e,t,i]){let r=ne(s),{values:n,keys:o}=this.dt(e,t,i);if(!Array.isArray(r))return this.ut=o,n;let a=this.ut??=[],l=[],u,_,c=0,g=r.length-1,m=0,f=n.length-1;for(;c<=g&&m<=f;)if(r[c]===null)c++;else if(r[g]===null)g--;else if(a[c]===o[m])l[m]=R(r[c],n[m]),c++,m++;else if(a[g]===o[f])l[f]=R(r[g],n[f]),g--,f--;else if(a[c]===o[f])l[f]=R(r[c],n[f]),F(s,l[f+1],r[c]),c++,f--;else if(a[g]===o[m])l[m]=R(r[g],n[m]),F(s,r[c],r[g]),g--,m++;else if(u===void 0&&(u=oe(o,m,f),_=oe(a,c,g)),u.has(a[c]))if(u.has(a[g])){let A=_.get(o[m]),w=A!==void 0?r[A]:null;if(w===null){let Ut=F(s,r[c]);R(Ut,n[m]),l[m]=Ut}else l[m]=R(w,n[m]),F(s,r[c],w),r[A]=null;m++}else mt(r[g]),g--;else mt(r[c]),c++;for(;m<=f;){let A=F(s,l[f+1]);R(A,n[m]),l[m++]=A}for(;c<=g;){let A=r[c++];A!==null&&mt(A)}return this.ut=o,re(s,l),b}});var le="important",ii=" !"+le,Mt=C(class extends T{constructor(s){if(super(s),s.type!==I.ATTRIBUTE||s.name!=="style"||s.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(s){return Object.keys(s).reduce((e,t)=>{let i=s[t];return i==null?e:e+`${t=t.includes("-")?t:t.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${i};`},"")}update(s,[e]){let{style:t}=s.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(e)),this.render(e);for(let i of this.ft)e[i]==null&&(this.ft.delete(i),i.includes("-")?t.removeProperty(i):t[i]=null);for(let i in e){let r=e[i];if(r!=null){this.ft.add(i);let n=typeof r=="string"&&r.endsWith(ii);i.includes("-")||n?t.setProperty(i,n?r.slice(0,-11):r,n?le:""):t[i]=r}}return b}});var de=["#f59e0b","#14b8a6","#6366f1","#ec4899","#0ea5e9","#22c55e"];function si(s){let e=0;for(let t=0;t<s.length;t++)e=e*31+s.charCodeAt(t)|0;return de[Math.abs(e)%de.length]}var kt="#03a9f4",ri="#ffffff",ni=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;function gt(s){let e=ni.exec(s.trim());if(!e)return null;let t=e[1];t.length===3&&(t=t.split("").map(r=>r+r).join(""));let i=parseInt(t,16);return[i>>16&255,i>>8&255,i&255]}function ce(s){let e=gt(s);if(e)return e;let t=/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s.trim());return t?[Number(t[1]),Number(t[2]),Number(t[3])].map(i=>Math.max(0,Math.min(255,Math.round(i)))):null}function _t([s,e,t]){return"#"+[s,e,t].map(i=>i.toString(16).padStart(2,"0")).join("")}function he([s,e,t]){let i=r=>{let n=r/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4};return .2126*i(s)+.7152*i(e)+.0722*i(t)}function oi(s,e){let t=he(s),i=he(e);return(Math.max(t,i)+.05)/(Math.min(t,i)+.05)}function pe(s,e,t){return s.map((i,r)=>Math.round(i+(e[r]-i)*t))}var ai=(s,e)=>pe(s,[255,255,255],e),li=(s,e)=>pe(s,[0,0,0],e);function ue(s,e){return typeof s=="string"&&gt(s)?_t(gt(s)):si(e??"")}var di={dark:{field:"rgba(0, 0, 0, 0.3)",hover:"rgba(255, 255, 255, 0.05)",track:"rgba(255, 255, 255, 0.14)"},light:{field:"rgba(0, 0, 0, 0.06)",hover:"rgba(0, 0, 0, 0.04)",track:"rgba(0, 0, 0, 0.1)"}},ci=4.5,hi=.38;function pi(s,e,t){if(t)return _t(ai(s,hi));let i=s;for(;oi(i,e)<ci&&i.some(r=>r>0);){let r=li(i,.12);i=r.every((n,o)=>n===i[o])?[0,0,0]:r}return _t(i)}function me(s,e,t){let i=ce(s)??gt(kt),r=ce(e)??(t?[28,28,28]:[255,255,255]);return{accent:_t(i),glyph:ri,ink:pi(i,r,t),...di[t?"dark":"light"]}}var ui="listapp-list-card",et=(s,e)=>typeof s=="boolean"?s:e;function ge(s){if(!s||typeof s!="object")throw new Error("Invalid configuration");if("show_title"in s)throw new Error("show_title was renamed to show_header");if(typeof s.entity!="string"||!/^todo\.[a-z0-9_]+$/.test(s.entity))throw new Error("Specify an entity from within the todo domain");if(s.item_tap_action!==void 0&&s.item_tap_action!=="toggle"&&s.item_tap_action!=="edit")throw new Error("item_tap_action must be 'toggle' or 'edit'");let e=s.collapse_to??0;if(typeof e!="number"||!Number.isInteger(e)||e<0)throw new Error("collapse_to must be a non-negative integer");return{entity:s.entity,title:typeof s.title=="string"&&s.title.trim()?s.title:void 0,useListColor:et(s.use_list_color,!0),showHeader:et(s.show_header,!0),showAdd:et(s.show_add,!0),showCompleted:et(s.show_completed,!0),showProgress:et(s.show_progress,!0),collapseTo:e,itemTapAction:s.item_tap_action??"toggle"}}function _e(s,e){let t=s.find(i=>i.startsWith("todo.")&&typeof e[i]?.attributes.list_id=="string")??s.find(i=>i.startsWith("todo."))??"";return{type:`custom:${ui}`,entity:t}}var N={CREATE:1,DELETE:2,UPDATE:4,MOVE:8},fe="unavailable",ve="unknown",O=(s,e)=>((s?.attributes.supported_features??0)&e)!==0,be=(s,e,t)=>s.connection.subscribeMessage(t,{type:"todo/item/subscribe",entity_id:e}),ye=(s,e,t)=>s.callService("todo","add_item",{item:t},{entity_id:e}),St=(s,e,t,i)=>s.callService("todo","update_item",{item:t.uid,status:i},{entity_id:e}),xe=(s,e,t,i)=>s.callService("todo","update_item",{item:t.uid,rename:i,status:t.status??"needs_action"},{entity_id:e}),It=(s,e,t)=>s.callService("todo","remove_item",{item:t},{entity_id:e}),$e=(s,e,t,i)=>s.callWS({type:"todo/item/move",entity_id:e,uid:t,previous_uid:i}),we=(s,e)=>s.callWS({type:"config/entity_registry/get",entity_id:e}),Ae=(s,e)=>s.callWS({type:"config_entries/get",domain:e}),Ee=s=>s.callWS({type:"config_entries/flow/progress"}),Te="/config/integrations/integration/listapp";function Ce(s){history.pushState(null,"",s),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0,detail:{replace:!1}}))}function gi(s){let e=[],t=[];for(let i of s)(i.status==="completed"?t:e).push(i);return{active:e,completed:t}}function Rt(s){return s?s.attributes.role==="viewer"?!0:!O(s,N.CREATE)||!O(s,N.UPDATE):!1}function _i(s,e,t){return t||e<=0||s.length<=e?{shown:s,hidden:0}:{shown:s.slice(0,e),hidden:s.length-e}}function fi(s,e,t){return t?`${s} ${s===1?"item":"items"} \xB7 view only`:s===0?"No items":`${e} of ${s} done`}function vi(s,e){let t=s?.attributes.friendly_name;return typeof t=="string"&&t.trim()?t:e.split(".")[1]?.replace(/^listapp_/,"").replace(/_/g," ")??e}var Pt=s=>s.state===fe||s.state===ve;function Ht(s,e,t,i=void 0,r="listapp"){return!s||!Pt(s)?"available":t?.some(a=>a.handler===r&&a.context?.source==="reauth"&&(!i||a.context.entry_id===i))||e?.some(a=>a.domain===r&&(!i||a.entry_id===i)&&a.state==="setup_error"&&/auth|token|sign in|log in|credential/i.test(a.reason??""))?"auth":"transient"}function Me({config:s,stateObj:e,items:t,availability:i,expanded:r}){let n=Rt(e),o=!n&&O(e,N.CREATE),a=!n&&O(e,N.UPDATE),l=!n&&O(e,N.DELETE),u=!n&&O(e,N.MOVE),{active:_,completed:c}=gi(t??[]),g=_.length+c.length,m=c.length,{shown:f,hidden:A}=_i(_,s.collapseTo,r),w;return e?i==="auth"?w="unavailable_auth":i==="transient"?w="unavailable_transient":t===void 0?w="loading":g===0?w="empty":_.length===0?w="all_done":w="list":w="missing",{state:w,viewer:n,canCreate:o,canUpdate:a,canDelete:l,canMove:u,title:s.title??vi(e,s.entity),subline:fi(g,m,n),total:g,done:m,progress:g===0?0:m/g,active:_,completed:c,visibleActive:f,hiddenActive:A,showHeader:s.showHeader,showAdd:s.showAdd&&o,showCompleted:s.showCompleted,showProgress:s.showProgress&&s.showHeader}}function ke(s,e,t){let i=s.filter(o=>o.uid!==e),r=s.find(o=>o.uid===e);if(!r)return{order:s,previousUid:void 0};let n=Math.max(0,Math.min(t,i.length));return i.splice(n,0,r),{order:i,previousUid:n===0?void 0:i[n-1].uid}}var Se="listapp-list-card-impl",Dt="listapp-list-card-editor",Ie="listapp-list-card-editor-impl";function Re(s,e,t={}){for(let[r,n]of e)if(!s.get(r))try{s.define(r,n)}catch{}let i=e.every(([r])=>s.get(r)!==void 0);return i&&t.onAllResolved?.(),i}function ft(s,e={}){let t=window.customElements;Re(t,s,e);let i=()=>{let o=window.customElements;return o===t?!1:(t=o,Re(o,s,e),!0)};t.whenDefined("home-assistant").then(i);let r=Date.now(),n=()=>{i()||Date.now()-r>3e4||setTimeout(n,250)};setTimeout(n,250)}var x={use_list_color:!0,show_header:!0,show_add:!0,show_completed:!0,show_progress:!0,collapse_to:0,item_tap_action:"toggle"},He=[{value:"toggle",label:"Toggle"},{value:"edit",label:"Edit"}];function bi(s){let e=Object.keys(s.states).filter(i=>i.startsWith("todo.")),t=e.filter(i=>typeof s.states[i]?.attributes.list_id=="string");return t.length?t:e}function Pe(s){return{entity:s.entity??"",title:s.title??"",use_list_color:s.use_list_color??x.use_list_color,show_header:s.show_header??x.show_header,show_add:s.show_add??x.show_add,show_completed:s.show_completed??x.show_completed,show_progress:s.show_progress??x.show_progress,collapse_to:s.collapse_to??x.collapse_to,item_tap_action:s.item_tap_action??x.item_tap_action}}function yi(s,e){let t={type:e,entity:s.entity},i=typeof s.title=="string"?s.title.trim():"";i&&(t.title=i),s.use_list_color!==x.use_list_color&&(t.use_list_color=s.use_list_color),s.show_header!==x.show_header&&(t.show_header=s.show_header),s.show_add!==x.show_add&&(t.show_add=s.show_add),s.show_completed!==x.show_completed&&(t.show_completed=s.show_completed),s.show_progress!==x.show_progress&&(t.show_progress=s.show_progress);let r=typeof s.collapse_to=="number"&&Number.isInteger(s.collapse_to)&&s.collapse_to>=0?s.collapse_to:x.collapse_to;return r!==x.collapse_to&&(t.collapse_to=r),s.item_tap_action!==x.item_tap_action&&(t.item_tap_action=s.item_tap_action),t}function xi(s,e){return[{name:"entity",required:!0,selector:{entity:{include_entities:s}}},{name:"title",selector:{text:{}}},{name:"use_list_color",selector:{boolean:{}}},{name:"show_header",selector:{boolean:{}}},{name:"show_add",selector:{boolean:{}}},{name:"show_completed",selector:{boolean:{}}},{name:"show_progress",selector:{boolean:{}},disabled:!e},{name:"collapse_to",selector:{number:{min:0,mode:"box"}}},{name:"item_tap_action",selector:{select:{mode:"dropdown",options:He}}}]}var j={entity:"List",title:"Title override",use_list_color:"Use list colour",show_header:"Show header",show_add:"Show add field",show_completed:"Show completed",show_progress:"Show progress bar",collapse_to:"Collapse to (0 = off)",item_tap_action:"Tap action"},G=class extends E{constructor(){super(...arguments);this._haForm=null;this._haFormChanged=t=>{t.stopPropagation(),this._emit(t.detail.value)};this._nativeChanged=t=>i=>{let r=i.currentTarget,n=Pe(this._config);r instanceof HTMLInputElement&&r.type==="checkbox"?n[t]=r.checked:r instanceof HTMLInputElement&&r.type==="number"?n[t]=Math.max(0,Math.trunc(Number(r.value)||0)):n[t]=r.value,this._emit(n)}}setConfig(t){this._config=t}connectedCallback(){super.connectedCallback(),this._haForm=customElements.get("ha-form")?!0:null,this._haForm===null&&customElements.whenDefined("ha-form").then(()=>{this._haForm=!0})}_entityIds(){if(!this.hass)return[];let t=bi(this.hass),i=this._config?.entity;return i&&!t.includes(i)?[i,...t]:t}render(){if(!this.hass||!this._config)return h;let t=Pe(this._config);return p`
      ${this._haForm?this._renderHaForm(t):this._renderNative(t)}
      ${t.entity&&Rt(this.hass.states[t.entity])?p`<p class="hint">The add field is always hidden for view-only lists, regardless of "Show add field".</p>`:h}
    `}_renderHaForm(t){return p`
      <ha-form
        .hass=${this.hass}
        .data=${t}
        .schema=${xi(this._entityIds(),t.show_header)}
        .computeLabel=${i=>j[i.name]??i.name}
        @value-changed=${this._haFormChanged}
      ></ha-form>
    `}_renderNative(t){let i=this._entityIds();return p`
      <div class="native">
        <label class="field">
          <span>${j.entity}</span>
          <select .value=${t.entity} @change=${this._nativeChanged("entity")}>
            ${i.length?i.map(r=>p`<option value=${r} ?selected=${r===t.entity}>${r}</option>`):p`<option value="">No Listapp lists found</option>`}
          </select>
        </label>
        <label class="field">
          <span>${j.title}</span>
          <input type="text" .value=${t.title} @input=${this._nativeChanged("title")} />
        </label>
        ${["use_list_color","show_header","show_add","show_completed","show_progress"].map(r=>p`
            <label class="field row">
              <span>${j[r]}</span>
              <input
                type="checkbox"
                .checked=${t[r]}
                ?disabled=${r==="show_progress"&&!t.show_header}
                @change=${this._nativeChanged(r)}
              />
            </label>
          `)}
        <label class="field">
          <span>${j.collapse_to}</span>
          <input type="number" min="0" .value=${String(t.collapse_to)} @input=${this._nativeChanged("collapse_to")} />
        </label>
        <label class="field">
          <span>${j.item_tap_action}</span>
          <select .value=${t.item_tap_action} @change=${this._nativeChanged("item_tap_action")}>
            ${He.map(r=>p`<option value=${r.value} ?selected=${r.value===t.item_tap_action}>${r.label}</option>`)}
          </select>
        </label>
      </div>
    `}_emit(t){let i=yi(t,this._config.type);this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i},bubbles:!0,composed:!0}))}static{this.styles=K`
    :host {
      display: block;
    }
    .native {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: var(--primary-text-color);
      font-family: inherit;
    }
    .field.row {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .field span {
      font-size: 0.9rem;
      color: var(--secondary-text-color);
    }
    input,
    select {
      font: inherit;
      color: var(--primary-text-color);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 6px 8px;
    }
    .field.row input {
      width: 20px;
      height: 20px;
      padding: 0;
    }
    .hint {
      margin: 8px 0 0;
      font-size: 0.85rem;
      color: var(--secondary-text-color);
    }
  `}};v([B({attribute:!1})],G.prototype,"hass",2),v([y()],G.prototype,"_config",2),v([y()],G.prototype,"_haForm",2);typeof customElements<"u"&&ft([[Ie,G]]);var V=class extends T{constructor(e){if(super(e),this.it=h,e.type!==I.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===h||e==null)return this._t=void 0,this.it=e;if(e===b)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};V.directiveName="unsafeHTML",V.resultType=1;var sr=C(V);var it=class extends V{};it.directiveName="unsafeSVG",it.resultType=2;var De=C(it);var vt={"list-checks":'<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/>',star:'<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',heart:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',sparkles:'<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',gift:'<path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/>',home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',"shopping-cart":'<path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18"/><path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25"/><circle cx="18" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',"shopping-bag":'<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',utensils:'<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>',coffee:'<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',cake:'<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',plane:'<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',car:'<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',"map-pin":'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',luggage:'<path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2"/><path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14"/><path d="M10 20h4"/><circle cx="16" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',backpack:'<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8"/><path d="M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',briefcase:'<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',"dollar-sign":'<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',"book-open":'<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>',"graduation-cap":'<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',dumbbell:'<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/>',music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',"party-popper":'<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>',"paw-print":'<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',baby:'<path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M15 12h.01"/><path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/><path d="M9 12h.01"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>'},Ue={plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',check:'<path d="M20 6 9 17l-5-5"/>',"square-check":'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m16 9-5.5 5.5L8 12"/>',"circle-check":'<circle cx="12" cy="12" r="10"/><path d="m16 9-5.5 5.5L8 12"/>',"triangle-alert":'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',"cloud-off":'<path d="M10.94 5.274A7 7 0 0 1 15.71 10h1.79a4.5 4.5 0 0 1 4.222 6.057"/><path d="M18.796 18.81A4.5 4.5 0 0 1 17.5 19H9A7 7 0 0 1 5.79 5.78"/><path d="m2 2 20 20"/>',"grip-vertical":'<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',"chevron-down":'<path d="m6 9 6 6 6-6"/>',"chevron-up":'<path d="m18 15-6-6-6 6"/>',"arrow-up":'<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',"arrow-down":'<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',trash:'<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',"list-checks":'<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/>'};var $i="list-checks",mr=Object.keys(vt);function wi(s){return s&&Object.hasOwn(vt,s)?s:$i}var Le=(s,e)=>Jt`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width=${e} height=${e} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${De(s)}</svg>`,Ne=(s,e=20)=>Le(vt[wi(s)],e),M=(s,e=20)=>Le(Ue[s],e);var d={addPlaceholder:"Add item",addButton:"Add item",active:"Active",completed:"Completed",reorder:"Reorder items",exitReorder:"Done reordering",clearCompleted:"Clear completed",clearConfirmTitle:"Clear completed items?",clearConfirmText:s=>`This will permanently delete ${s} completed ${s===1?"item":"items"} from the list.`,uncheckAll:"Uncheck all",uncheckConfirmTitle:"Uncheck all completed items?",uncheckConfirmText:s=>`This will mark ${s} completed ${s===1?"item":"items"} as not done. Nothing is deleted.`,cancel:"Cancel",delete:"Delete",save:"Save",editTitle:"Edit item",editLabel:"Item",editRequired:"Enter an item name.",emptyTitle:"Nothing on this list",emptyBody:"Add the first item above, or ask Assist to add one.",emptyBodyNoAdd:"Ask Assist or the Listapp app to add the first item.",emptyBodyViewer:"Nothing has been added yet.",allDoneTitle:"All done",allDoneBody:"Every item on this list is checked off.",allDoneHidden:s=>`${s} completed ${s===1?"item is":"items are"} hidden.`,authTitle:"List unavailable",authBody:"Listapp needs you to sign in again before this list can sync.",signIn:"Sign in",transientTitle:"Can't reach Listapp right now",transientBody:"Home Assistant will keep retrying. Check the integration if this persists.",saveFailed:"Listapp couldn't save that change. Try again.",checkIntegration:"Check integration",missing:s=>`Entity not found: ${s}`,showMore:s=>`Show ${s} more`,showLess:"Show less",markDone:s=>`Mark "${s}" done`,markActive:s=>`Mark "${s}" not done`,dragHandle:s=>`Move "${s}" \u2014 drag, or use arrow keys`,menu:s=>`${s} options`};var Ai=560,Ei=3e4,Ti=2e3,Ci=3e4,$=class extends E{constructor(){super(...arguments);this._availability="available";this._expanded=!1;this._reordering=!1;this._menu=null;this._wide=!1;this._dialog=null;this._dragUid=null;this._dropIndex=null;this._pending=!1;this._subscriptionGeneration=0;this._retryAttempts=0;this._availabilityGeneration=0;this._itemsVersion=0;this._entryIdGeneration=0;this._submitAdd=async t=>{t.preventDefault();let r=t.currentTarget.elements.namedItem("summary"),n=r.value.trim();if(!n||!this.hass||!this._config||this._pending)return;let{hass:o,_config:a}=this;await this._guarded(()=>ye(o,a.entity,n))&&(r.value=""),r.focus()};this._checkboxChanged=t=>{let i=t.currentTarget;this._toggleItem(this._item(i.dataset.uid))};this._itemTapped=t=>{let i=t.currentTarget.dataset.uid,r=this._item(i);r&&(this._config.itemTapAction==="edit"?this._dialog={kind:"edit",item:r}:this._toggleItem(r))};this._toggleExpanded=()=>{this._expanded=!this._expanded};this._toggleMenu=t=>{let i=t.currentTarget.dataset.menu;this._menu=this._menu===i?null:i};this._onDocumentClick=t=>{!this._menu||t.composedPath().some(r=>r instanceof HTMLElement&&r.classList.contains("menu-btn")&&r.getRootNode()===this.renderRoot)||(this._menu=null)};this._menuKeydown=t=>{if(t.key==="Escape"&&this._menu){let i=this._menu;this._menu=null,this.renderRoot.querySelector(`.menu-btn[data-menu="${i}"]`)?.focus()}};this._toggleReorder=()=>{this._reordering=!this._reordering,this._menu=null,this._reordering&&(this._expanded=!0);let t=this._reordering?".handle":'.menu-btn[data-menu="active"]';this.updateComplete.then(()=>this.renderRoot.querySelector(t)?.focus())};this._clearCompleted=async()=>{let t=this._dialog;if(this._pending)return;let i=t?.kind==="confirm-clear"?t.uids.filter(r=>this._item(r)?.status==="completed"):[];if(i.length&&this.hass&&this._config){let{hass:r,_config:n}=this;if(!await this._guarded(()=>It(r,n.entity,i)))return}this._closeDialog()};this._uncheckAll=async()=>{let t=this._dialog;if(this._pending||t?.kind!=="confirm-uncheck"||!this.hass||!this._config)return;let i=t.uids.map(l=>this._item(l)).filter(l=>l?.status==="completed");if(i.length===0){this._closeDialog();return}let{hass:r,_config:n}=this,o=new Set(i.map(l=>l.uid)),a=this._itemsVersion;this._items=this._items?.map(l=>o.has(l.uid)?{...l,status:"needs_action"}:l),this._pending=!0;try{let l=await Promise.all(i.map(u=>this._call(()=>St(r,n.entity,u,"needs_action"))));if(this._itemsVersion===a&&this._config===n){let u=new Set(i.filter((_,c)=>!l[c]).map(_=>_.uid));u.size&&(this._items=this._items?.map(_=>u.has(_.uid)?{..._,status:"completed"}:_))}}finally{this._pending=!1}this._closeDialog()};this._closeDialog=()=>{let t=this.renderRoot?.querySelector("dialog");t?.open&&t.close(),this._dialog=null};this._saveEdit=async t=>{t.preventDefault();let i=this._dialog,n=t.currentTarget.elements.namedItem("summary"),o=n.value.trim();if(i?.kind==="edit"&&!o){n.setCustomValidity(d.editRequired),n.reportValidity();return}if(n.setCustomValidity(""),!this._pending){if(i?.kind==="edit"&&o&&o!==i.item.summary&&this.hass&&this._config){let{hass:a,_config:l}=this,u=this._item(i.item.uid)??i.item;if(!await this._guarded(()=>xe(a,l.entity,u,o)))return}this._closeDialog()}};this._deleteFromDialog=async()=>{let t=this._dialog;if(!this._pending){if(t?.kind==="edit"&&this.hass&&this._config){let{hass:i,_config:r}=this;if(!await this._guarded(()=>It(i,r.entity,[t.item.uid])))return}this._closeDialog()}};this._signIn=()=>{Ce(Te)};this._dragStart=t=>{let i=t.currentTarget;this._dragUid=i.dataset.uid??null,t.dataTransfer?.setData("text/plain",this._dragUid??""),t.dataTransfer&&(t.dataTransfer.effectAllowed="move")};this._dragOver=t=>{if(!this._dragUid)return;t.preventDefault();let i=t.target.closest("li.item");if(!i)return;let r=i.getBoundingClientRect(),n=Number(i.dataset.index);this._dropIndex=t.clientY>r.top+r.height/2?n+1:n};this._drop=t=>{t.preventDefault();let i=this._dragUid,r=this._dropIndex;if(this._dragUid=null,this._dropIndex=null,!i||r===null)return;let o=this._view().active.findIndex(l=>l.uid===i),a=r>o?r-1:r;this._move(i,a)};this._dragEnd=()=>{this._dragUid=null,this._dropIndex=null};this._handleKeydown=t=>{if(t.key!=="ArrowUp"&&t.key!=="ArrowDown")return;t.preventDefault();let i=t.currentTarget,r=i.dataset.uid,n=Number(i.dataset.index),o=t.key==="ArrowUp"?n-1:n+1,a=this._view().active;o<0||o>=a.length||this._move(r,o).then(async()=>{await this.updateComplete,this.renderRoot.querySelector(`.handle[data-uid="${r}"]`)?.focus()})}}static getStubConfig(t,i=[],r=[]){let n=i.length||r.length?[...i,...r]:Object.keys(t.states);return _e(n,t.states)}static getConfigElement(){return document.createElement(Dt)}setConfig(t){this._config=ge(t),this._expanded=!1,this._reordering=!1,this._menu=null,this._closeDialog()}async _call(t){try{return await t(),!0}catch(i){return console.warn("listapp-list-card: service call failed",i),this.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:{message:d.saveFailed}})),this.requestUpdate(),!1}}getCardSize(){if(!this._config)return 3;let t=this._view();if(t.state==="missing"||t.state==="unavailable_auth"||t.state==="unavailable_transient")return 3;let i=this._wide?2:1,r=t.showCompleted&&!this._reordering?t.completed.length:0,n=Math.ceil(t.visibleActive.length/i)+Math.ceil(r/i),o=t.state==="loading",a=t.state==="all_done"&&this._consolidateCompleted(t)?1:0,l=t.showHeader?1+(t.showProgress&&!o?1:0):0,u=t.showAdd&&!o?1:0;return l+u+n+a+1}getGridOptions(){return{columns:12,min_columns:6}}connectedCallback(){super.connectedCallback(),this.hasUpdated&&(this._subscribe(),this._trackAvailability()),this._resize??=new ResizeObserver(t=>{let i=t[0]?.contentRect.width??0;this._wide=i>=Ai}),this._resize.observe(this),document.addEventListener("click",this._onDocumentClick)}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribe(),this._resize?.disconnect(),document.removeEventListener("click",this._onDocumentClick),this._stopAvailabilityTimer(),this._checkedAvailabilityFor=void 0,this._closeDialog(),this._menu=null}willUpdate(t){if(!this.hass||!this._config)return;let i=this._config.entity in this.hass.states;if(i?(this._subscribedEntity!==this._config.entity||!this._unsub&&i)&&(this._items=void 0,this._subscribe()):(this._unsubscribe(),this._items=void 0,this._entryIdFor=void 0,this._entryId=void 0,this._entryIdGeneration++,this._closeDialog(),this._menu=null),(t.has("hass")||t.has("_config"))&&this._trackAvailability(),this._reordering||this._dialog||this._menu){let r=this._view();this._reordering&&(r.active.length===0||!r.canMove)&&(this._reordering=!1),(r.state==="unavailable_auth"||r.state==="unavailable_transient"||!r.canUpdate)&&(this._dialog&&this._closeDialog(),this._menu=null)}}_stateObj(){return this.hass&&this._config?this.hass.states[this._config.entity]:void 0}_view(){return Me({config:this._config,stateObj:this._stateObj(),items:this._items,availability:this._availability,expanded:this._expanded})}_subscribe(){if(this._unsubscribe(),!this.hass||!this._config||!(this._config.entity in this.hass.states))return;let t=this._config.entity;this._retryEntity!==t&&(this._retryEntity=t,this._retryAttempts=0);let i=++this._subscriptionGeneration;this._subscribedEntity=t;let r=be(this.hass,t,n=>{this._subscriptionGeneration===i&&this._subscribedEntity===t&&(this._items=n.items,this._itemsVersion++)}).then(n=>(this._subscriptionGeneration===i&&(this._retryAttempts=0),n)).catch(n=>(console.warn("listapp-list-card: item subscription failed",n),this._subscriptionGeneration===i&&this._scheduleRetry(),()=>{}));this._unsub=r}_scheduleRetry(){let t=Math.min(Ti*2**this._retryAttempts,Ci);this._retryAttempts++,this._cancelRetry(),this._retryTimer=window.setTimeout(()=>{this._retryTimer=void 0,this.isConnected&&this._subscribe()},t)}_cancelRetry(){this._retryTimer!==void 0&&(window.clearTimeout(this._retryTimer),this._retryTimer=void 0)}_unsubscribe(){this._cancelRetry(),this._subscriptionGeneration++,this._unsub?.then(t=>t()),this._unsub=void 0,this._subscribedEntity=void 0}_trackAvailability(){let t=this._stateObj();if(!t||!Pt(t)){this._availability="available",this._checkedAvailabilityFor=void 0,this._stopAvailabilityTimer();return}let i=`${t.entity_id}:${t.state}`;this._checkedAvailabilityFor!==i&&(this._checkedAvailabilityFor=i,this._availability="transient",this._checkAvailability(),this._stopAvailabilityTimer(),this._availabilityTimer=window.setInterval(()=>{this._checkAvailability()},Ei))}_stopAvailabilityTimer(){this._availabilityTimer!==void 0&&(window.clearInterval(this._availabilityTimer),this._availabilityTimer=void 0)}async _checkAvailability(){let t=this._config?.entity,i=this._checkedAvailabilityFor;if(!this.hass||!t||!i)return;let r=++this._availabilityGeneration,n;try{let[o,a,l]=await Promise.all([Ae(this.hass,"listapp"),Ee(this.hass),this._resolveEntryId()]);n=Ht(this._stateObj(),o,a,l)}catch{n=Ht(this._stateObj(),void 0,void 0)}this._availabilityGeneration===r&&this._config?.entity===t&&this._checkedAvailabilityFor===i&&(this._availability=n)}async _resolveEntryId(){let t=this._config?.entity;if(!(!this.hass||!t)){if(this._entryIdFor!==t){let i=++this._entryIdGeneration;try{let r=(await we(this.hass,t)).config_entry_id??null;if(this._entryIdGeneration!==i||this._config?.entity!==t)return;this._entryId=r,this._entryIdFor=t}catch{return}}return this._entryId}}_resolvePalette(){let t=this._stateObj(),i=this.hass?.themes?.darkMode??window.matchMedia?.("(prefers-color-scheme: dark)").matches??!1,r=getComputedStyle(this),n=r.getPropertyValue("--card-background-color").trim()||(i?"#1c1c1c":"#ffffff"),o=this._config.useListColor?ue(t?.attributes.list_color,t?.attributes.list_id??this._config.entity):r.getPropertyValue("--primary-color").trim()||kt,a=`${o}|${n}|${i}`;return this._paletteKey!==a&&(this._paletteKey=a,this._palette=me(o,n,i)),this._palette}render(){if(!this.hass||!this._config)return h;let t=this._view(),i=this._resolvePalette(),r={"--la-accent":i.accent,"--la-glyph":i.glyph,"--la-ink":i.ink,"--la-field":i.field,"--la-hover":i.hover,"--la-track":i.track};return p`
      <ha-card
        style=${Mt(r)}
        class=${tt({wide:this._wide,viewer:t.viewer,reordering:this._reordering})}
      >
        ${t.state==="missing"?this._renderMissing():this._renderCard(t)}
        ${this._renderDialog(t)}
      </ha-card>
    `}_renderMissing(){return p`<div class="notice">${M("triangle-alert",22)}<span>${d.missing(this._config.entity)}</span></div>`}_renderCard(t){let i=this._stateObj();return t.state==="unavailable_auth"||t.state==="unavailable_transient"?this._renderUnavailable(t):p`
      ${this._renderHeader(t,i.attributes.list_icon)}
      ${t.showProgress&&t.state!=="loading"?this._renderProgress(t):h}
      ${this._renderBody(t)}
    `}_completedRendered(t){return t.showCompleted&&t.completed.length>0&&!this._reordering}_consolidateCompleted(t){return!this._completedRendered(t)&&t.completed.length>0&&(t.canDelete||t.canUpdate)}_renderHeader(t,i){return t.showHeader?p`
      <header class="head">
        <div class="tile" aria-hidden="true">${Ne(i,20)}</div>
        <div class="titles">
          <h2 class="title">${t.title}</h2>
          <p class="subline">${t.subline}</p>
        </div>
      </header>
    `:h}_renderProgress(t){let i=Math.round(t.progress*100);return p`
      <div
        class="progress"
        role="progressbar"
        aria-label=${d.completed}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${i}
      >
        <div class="progress-fill" style=${Mt({width:`${i}%`})}></div>
      </div>
    `}_renderUnavailable(t){let i=t.state==="unavailable_auth";return p`
      <div class="state unavailable">
        <div class="warn">${M(i?"triangle-alert":"cloud-off",28)}</div>
        <h3>${i?d.authTitle:d.transientTitle}</h3>
        <p>${i?d.authBody:d.transientBody}</p>
        ${i?p`<button class="primary" @click=${this._signIn}>${d.signIn}</button>`:p`<button class="text" @click=${this._signIn}>${d.checkIntegration}</button>`}
      </div>
    `}_renderBody(t){return p`
      ${t.state==="loading"?h:p`${t.showAdd?this._renderAdd():h}${this._renderSections(t)}`}
    `}_renderAdd(){return p`
      <form class="add" @submit=${this._submitAdd}>
        <input
          class="add-input"
          name="summary"
          type="text"
          autocomplete="off"
          placeholder=${d.addPlaceholder}
          aria-label=${d.addPlaceholder}
        />
        <button type="submit" class="add-btn" title=${d.addButton} aria-label=${d.addButton}>
          ${M("plus",20)}
        </button>
      </form>
    `}_renderSections(t){if(t.state==="empty")return p`
        <div class="state empty">
          <div class="state-icon">${M("square-check",23)}</div>
          <h3>${d.emptyTitle}</h3>
          <p>${t.viewer?d.emptyBodyViewer:t.showAdd?d.emptyBody:d.emptyBodyNoAdd}</p>
        </div>
      `;let i=this._reordering?d.reorder:d.active,r=this._consolidateCompleted(t),n=t.canMove&&t.active.length>0||r;return p`
      ${t.state==="all_done"?p`
            ${n?p`<div class="section-head menu-only">${this._renderMenu("active",t,!1,r)}</div>`:h}
            <div class="state all-done">
              <div class="state-icon done">${M("check",24)}</div>
              <h3>${d.allDoneTitle}</h3>
              <p>${t.showCompleted?d.allDoneBody:d.allDoneHidden(t.done)}</p>
            </div>
          `:p`
            <section class="section" aria-label=${d.active}>
              <div class="section-head">
                <h3>${i}<span class="count"> · ${t.active.length}</span></h3>
                ${n?this._renderMenu("active",t,!1,r):h}
              </div>
              ${this._renderItems(t.visibleActive,t,!0)}
              ${!this._reordering&&(t.hiddenActive>0||this._expanded&&this._config.collapseTo>0&&t.active.length>this._config.collapseTo)?p`
                    <button class="more" @click=${this._toggleExpanded} aria-expanded=${this._expanded}>
                      ${this._expanded?d.showLess:d.showMore(t.hiddenActive)}
                      ${M(this._expanded?"chevron-up":"chevron-down",15)}
                    </button>
                  `:h}
            </section>
          `}
      ${this._completedRendered(t)?p`
            <div class="divider" role="separator"></div>
            <section class="section completed" aria-label=${d.completed}>
              <div class="section-head">
                <h3>${d.completed}<span class="count"> · ${t.completed.length}</span></h3>
                ${t.canDelete||t.canUpdate?this._renderMenu("completed",t,!0,!1):h}
              </div>
              ${this._renderItems(t.completed,t,!1)}
            </section>
          `:h}
    `}_renderMenu(t,i,r,n){let o=this._menu===t,a=t==="active"?d.active:d.completed,l=t==="active"&&i.canMove&&i.active.length>0,u=t==="active"?n:!0;return p`
      <div class="menu-wrap" @keydown=${this._menuKeydown}>
        <button
          class="menu-btn"
          aria-haspopup="menu"
          aria-expanded=${o}
          aria-label=${d.menu(a)}
          title=${d.menu(a)}
          data-menu=${t}
          @click=${this._toggleMenu}
        >
          <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>
        ${o?p`
              <div class=${tt({menu:!0,up:r})} role="menu">
                ${l?p`<button role="menuitem" @click=${this._toggleReorder}>
                      ${this._reordering?d.exitReorder:d.reorder}
                    </button>`:h}
                ${u&&i.canUpdate&&i.completed.length>0?p`<button role="menuitem" @click=${()=>this._confirmUncheckAll(i)}>${d.uncheckAll}</button>`:h}
                ${u&&i.canDelete&&i.completed.length>0?p`<button role="menuitem" class="danger" @click=${()=>this._confirmClear(i)}>
                      ${M("trash",18)} ${d.clearCompleted}
                    </button>`:h}
              </div>
            `:h}
      </div>
    `}_renderItems(t,i,r){let n=this._reordering&&r&&i.canMove;return p`
      <ul
        class=${tt({items:!0,reorder:n})}
        @dragover=${n?this._dragOver:h}
        @drop=${n?this._drop:h}
      >
        ${ae(t,o=>o.uid,(o,a)=>this._renderItem(o,a,i,n))}
      </ul>
    `}_renderItem(t,i,r,n){let o=t.status==="completed",a=r.canUpdate,l=o?d.markActive(t.summary):d.markDone(t.summary);return p`
      <li
        class=${tt({item:!0,done:o,interactive:a,dragging:this._dragUid===t.uid,"drop-before":this._dropIndex===i&&this._dragUid!==t.uid})}
        data-uid=${t.uid}
        data-index=${i}
        draggable=${n?"true":"false"}
        @dragstart=${n?this._dragStart:h}
        @dragend=${n?this._dragEnd:h}
      >
        <label class="check">
          <input
            type="checkbox"
            .checked=${o}
            .disabled=${!a}
            aria-label=${l}
            data-uid=${t.uid}
            @change=${this._checkboxChanged}
          />
          <span class="box" aria-hidden="true">${M("check",14)}</span>
        </label>
        ${a?p`<button class="summary" data-uid=${t.uid} @click=${this._itemTapped}>${t.summary}</button>`:p`<span class="summary">${t.summary}</span>`}
        ${n?p`
              <button
                class="icon-btn handle"
                aria-label=${d.dragHandle(t.summary)}
                title=${d.dragHandle(t.summary)}
                data-uid=${t.uid}
                data-index=${i}
                @keydown=${this._handleKeydown}
              >
                ${M("grip-vertical",18)}
              </button>
            `:h}
      </li>
    `}_renderDialog(t){let i=this._dialog;return i?i.kind==="edit"?p`
        <dialog class="dialog" @close=${this._closeDialog} @cancel=${this._closeDialog}>
          <form method="dialog" @submit=${this._saveEdit}>
            <h3>${d.editTitle}</h3>
            <label class="field">
              <span>${d.editLabel}</span>
              <input name="summary" type="text" required autofocus .value=${i.item.summary} />
            </label>
            <div class="actions">
              ${t.canDelete?p`<button type="button" class="danger text" .disabled=${this._pending} @click=${this._deleteFromDialog}>
                    ${d.delete}
                  </button>`:h}
              <span class="spacer"></span>
              <button type="button" class="text" @click=${this._closeDialog}>${d.cancel}</button>
              <button type="submit" class="primary" .disabled=${this._pending}>${d.save}</button>
            </div>
          </form>
        </dialog>
      `:i.kind==="confirm-uncheck"?p`
        <dialog class="dialog" @close=${this._closeDialog} @cancel=${this._closeDialog}>
          <h3>${d.uncheckConfirmTitle}</h3>
          <p>${d.uncheckConfirmText(i.uids.length)}</p>
          <div class="actions">
            <span class="spacer"></span>
            <button type="button" class="text" @click=${this._closeDialog}>${d.cancel}</button>
            <button type="button" class="primary" .disabled=${this._pending} @click=${this._uncheckAll}>
              ${d.uncheckAll}
            </button>
          </div>
        </dialog>
      `:p`
      <dialog class="dialog" @close=${this._closeDialog} @cancel=${this._closeDialog}>
        <h3>${d.clearConfirmTitle}</h3>
        <p>${d.clearConfirmText(i.uids.length)}</p>
        <div class="actions">
          <span class="spacer"></span>
          <button type="button" class="text" @click=${this._closeDialog}>${d.cancel}</button>
          <button type="button" class="primary danger-bg" .disabled=${this._pending} @click=${this._clearCompleted}>
            ${d.delete}
          </button>
        </div>
      </dialog>
    `:h}updated(t){if(t.has("_dialog")&&this._dialog){let i=this.renderRoot.querySelector("dialog");i&&!i.open&&(i.showModal(),i.querySelector("input")?.select())}}_item(t){return t?this._items?.find(i=>i.uid===t):void 0}async _guarded(t){this._pending=!0;try{return await this._call(t)}finally{this._pending=!1}}async _toggleItem(t){if(!t||!this.hass||!this._config)return;let i=t.status==="needs_action"?"completed":"needs_action",{hass:r,_config:n}=this,o=this._itemsVersion;this._items=this._items?.map(a=>a.uid===t.uid?{...a,status:i}:a),await this._call(()=>St(r,n.entity,t,i))||this._itemsVersion===o&&this._config===n&&(this._items=this._items?.map(a=>a.uid===t.uid?{...a,status:t.status}:a))}_confirmClear(t){this._menu=null,this._dialog={kind:"confirm-clear",uids:t.completed.map(i=>i.uid)}}_confirmUncheckAll(t){this._menu=null,this._dialog={kind:"confirm-uncheck",uids:t.completed.map(i=>i.uid)}}async _move(t,i){if(!this.hass||!this._config||!this._items)return;let r=this._items,{active:n,completed:o}=this._view();if(!n.some(g=>g.uid===t))return;let{order:a,previousUid:l}=ke(n,t,i);this._items=[...a,...o];let{hass:u,_config:_}=this,c=this._itemsVersion;if(!await this._call(()=>$e(u,_.entity,t,l))&&this._itemsVersion===c&&this._config===_&&this._items){let g=new Map(this._items.map(m=>[m.uid,m]));this._items=r.map(m=>g.get(m.uid)??m)}}static{this.styles=K`
    :host {
      display: block;
    }
    ha-card {
      display: block;
      position: relative;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
      color: var(--primary-text-color);
      font-family: var(--ha-card-font-family, var(--paper-font-body1_-_font-family, inherit));
      --la-target: 44px;
      --la-muted: var(--secondary-text-color);
    }
    button {
      font: inherit;
      color: inherit;
      background: none;
      border: 0;
      padding: 0;
      margin: 0;
      cursor: pointer;
    }
    button:focus-visible,
    input:focus-visible {
      outline: 2px solid var(--la-ink);
      outline-offset: 2px;
    }
    svg {
      display: block;
    }
    .viewer button.summary,
    .viewer .check {
      cursor: default;
    }

    .head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 18px 0;
    }
    .tile {
      flex: none;
      width: 38px;
      height: 38px;
      border-radius: 11px;
      display: grid;
      place-items: center;
      background: var(--la-accent);
      color: var(--la-glyph);
    }
    .titles {
      flex: 1;
      min-width: 0;
    }
    .title {
      margin: 0;
      font-size: var(--ha-font-size-xl, 20px);
      font-weight: var(--ha-font-weight-normal, 400);
      line-height: var(--ha-line-height-condensed, 1.2);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .subline {
      margin: 3px 0 0;
      font-size: var(--ha-font-size-s, 12px);
      font-weight: var(--ha-font-weight-normal, 400);
      line-height: var(--ha-line-height-condensed, 1.2);
      color: var(--la-muted);
    }

    .progress {
      height: 5px;
      margin: 14px 18px 0;
      border-radius: 99px;
      background: var(--la-track);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 99px;
      background: var(--la-accent);
      transition: width 200ms ease;
    }

    .add {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin: 16px 18px 0;
      box-sizing: border-box;
      height: 56px;
      padding: 0 var(--ha-space-4, 16px);
      border-radius: var(--ha-border-radius-sm, 4px) var(--ha-border-radius-sm, 4px) 0 0;
      background: var(--la-field);
      border-bottom: 2px solid var(--la-accent);
    }
    .add-input {
      flex: 1;
      min-width: 0;
      padding: 0;
      font: inherit;
      font-size: var(--ha-font-size-m, 14px);
      font-weight: var(--ha-font-weight-normal, 400);
      line-height: 20px;
      color: var(--primary-text-color);
      background: transparent;
      border: 0;
      outline: none;
    }
    .add-input::placeholder {
      color: var(--la-muted);
      opacity: 1;
    }
    .add-btn {
      flex: none;
      position: relative;
      width: 20px;
      height: 20px;
      color: var(--la-ink);
    }
    .add-btn svg {
      stroke-width: 2.4;
    }
    .add-btn::before,
    .menu-btn::before {
      content: "";
      position: absolute;
      inset: -12px;
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 6px;
    }
    .completed .section-head {
      padding: 14px 16px 4px;
    }
    .section-head.menu-only {
      justify-content: flex-end;
      padding: 12px 12px 0;
    }
    .section-head h3 {
      margin: 0;
      font-size: var(--ha-font-size-m, 14px);
      font-weight: var(--ha-font-weight-medium, 500);
      letter-spacing: normal;
      color: var(--primary-text-color);
    }
    .section-head h3 .count {
      color: var(--la-muted);
    }
    .divider {
      height: 1px;
      margin: 12px 0 0;
      background: var(--divider-color);
    }
    .menu-btn {
      position: relative;
      padding: 5px;
      border-radius: 6px;
      color: var(--la-muted);
    }
    .menu-btn:hover,
    .menu-btn[aria-expanded="true"] {
      background: var(--la-hover);
    }
    .dots {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .dots i {
      width: 3.5px;
      height: 3.5px;
      border-radius: 50%;
      background: currentColor;
    }

    .items {
      list-style: none;
      margin: 0;
      padding: 0 10px 4px;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 2px;
    }
    .completed .items {
      padding-bottom: 12px;
    }
    .section:last-child .items {
      padding-bottom: 12px;
    }
    .wide .items {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 13px;
      min-height: var(--la-target);
      box-sizing: border-box;
      padding: 11px 8px;
      border-radius: 10px;
    }
    .item.interactive:hover {
      background: var(--la-hover);
    }
    .check {
      flex: none;
      position: relative;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
    .check input {
      position: absolute;
      inset: -12px;
      width: var(--la-target);
      height: var(--la-target);
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }
    .check input:disabled {
      cursor: default;
    }
    .box {
      width: 20px;
      height: 20px;
      box-sizing: border-box;
      border-radius: var(--ha-border-radius-sm, 4px);
      border: 2px solid var(--ha-color-border-neutral-normal, var(--la-muted));
      display: grid;
      place-items: center;
      color: transparent;
      transition:
        background 120ms ease,
        border-color 120ms ease;
    }
    .box svg {
      stroke-width: 3.2;
    }
    .check input:checked + .box {
      background: var(--la-accent);
      border-color: var(--la-accent);
      color: var(--la-glyph);
    }
    .check input:focus-visible + .box {
      outline: 2px solid var(--la-ink);
      outline-offset: 2px;
    }
    .summary {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      padding: 0;
      text-align: left;
      font-size: var(--ha-font-size-m, 14px);
      font-weight: var(--ha-font-weight-normal, 400);
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .done .summary {
      color: var(--la-muted);
      text-decoration: line-through;
    }
    .handle {
      flex: none;
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      cursor: grab;
      color: var(--la-muted);
    }
    .reorder .item.dragging {
      opacity: 0.4;
    }
    .reorder .item.drop-before {
      box-shadow: inset 0 2px 0 var(--la-accent);
    }

    .more {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin: 6px 18px 0;
      padding: 4px 0;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--la-ink);
    }
    .more svg {
      stroke-width: 2.6;
    }
    .section:last-child .more {
      margin-bottom: 14px;
    }

    .menu-wrap {
      position: relative;
    }
    .menu {
      position: absolute;
      top: calc(100% + 2px);
      right: 0;
      z-index: 2;
      min-width: 200px;
      padding: 4px 0;
      border-radius: 12px;
      background: var(--card-background-color, #fff);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
      border: 1px solid var(--divider-color);
    }
    .menu.up {
      top: auto;
      bottom: calc(100% + 2px);
    }
    .menu button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-height: var(--la-target);
      padding: 0 16px;
      text-align: left;
      white-space: nowrap;
      font-size: 14px;
      font-weight: 600;
    }
    .menu button:hover {
      background: var(--la-hover);
    }
    .danger {
      color: var(--error-color, #db4437);
    }

    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 9px;
      text-align: center;
      padding: 30px 22px 28px;
    }
    .state.all-done {
      padding: 26px 22px 24px;
    }
    .state.unavailable {
      gap: 10px;
      padding: 30px 22px 26px;
    }
    .state-icon {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: var(--la-accent);
      color: var(--la-glyph);
    }
    .state-icon.done {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--la-accent);
      color: var(--la-glyph);
    }
    .state-icon.done svg {
      stroke-width: 3;
    }
    .warn {
      color: var(--warning-color, #f59e0b);
    }
    .state h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
    }
    .state p {
      margin: 0;
      max-width: 250px;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--la-muted);
    }
    .state.unavailable p {
      max-width: 270px;
    }
    .state .primary,
    .state .text {
      margin-top: 6px;
    }
    .notice {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      color: var(--warning-color, #ff9800);
    }

    .primary {
      padding: 9px 16px;
      border-radius: 10px;
      background: var(--la-accent);
      color: var(--la-glyph);
      font-size: 14px;
      font-weight: 700;
    }
    .primary.danger-bg {
      background: var(--error-color, #db4437);
      color: #fff;
    }
    .text {
      padding: 9px 16px;
      border-radius: 10px;
      color: var(--la-ink);
      font-size: 14px;
      font-weight: 700;
    }
    .text:hover {
      background: var(--la-hover);
    }
    .primary:hover {
      filter: brightness(0.95);
    }

    .dialog {
      min-width: min(320px, calc(100vw - 32px));
      max-width: 480px;
      padding: 20px 24px;
      border: 0;
      border-radius: var(--ha-dialog-border-radius, 28px);
      background: var(--card-background-color, var(--ha-card-background, #fff));
      color: var(--primary-text-color);
      box-shadow: var(--ha-card-box-shadow, 0 8px 32px rgba(0, 0, 0, 0.32));
    }
    .dialog::backdrop {
      background: rgba(0, 0, 0, 0.32);
    }
    .dialog h3 {
      margin: 0 0 12px;
      font-size: 17.5px;
      font-weight: 800;
      letter-spacing: -0.2px;
    }
    .dialog p {
      margin: 0 0 12px;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--la-muted);
    }
    .field {
      display: block;
    }
    .field span {
      display: block;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--la-muted);
      margin-bottom: 6px;
    }
    .field input {
      width: 100%;
      box-sizing: border-box;
      padding: 13px 14px;
      font: inherit;
      font-size: 15.5px;
      font-weight: 500;
      color: var(--primary-text-color);
      background: var(--la-field);
      border: 0;
      border-radius: 10px 10px 0 0;
      border-bottom: 2px solid var(--la-accent);
      outline: none;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 20px;
    }
    .spacer {
      flex: 1;
    }
  `}};v([B({attribute:!1})],$.prototype,"hass",2),v([y()],$.prototype,"_config",2),v([y()],$.prototype,"_items",2),v([y()],$.prototype,"_availability",2),v([y()],$.prototype,"_expanded",2),v([y()],$.prototype,"_reordering",2),v([y()],$.prototype,"_menu",2),v([y()],$.prototype,"_wide",2),v([y()],$.prototype,"_dialog",2),v([y()],$.prototype,"_dragUid",2),v([y()],$.prototype,"_dropIndex",2),v([y()],$.prototype,"_pending",2);ft([[Se,$]]);export{$ as ListAppListCard};
