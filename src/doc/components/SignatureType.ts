import * as owl from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';
import { Link } from 'owl-framework/src/router/link';

interface SignatureTypeContent {
    type: string;
    types: SignatureTypeContent[];
}

interface SignatureTypeProp {
    content: SignatureTypeContent;
}
export class SignatureType extends owl.Component<Env, SignatureTypeProp> {
    static components = { SignatureType: SignatureType, Link };
    // onSelectType(object: any): void {
    //     this.trigger('select-object', object.id);
    // }
    async willStart(): Promise<any> {
        if ((this.props as any).type && (this.props as any).type.name === 'Record') {
            console.log('signaturetype this.props.type:', (this.props as any).type);
            if ((this.props as any).name === 'testDispatcherRegistry') {
                console.log('this.props.type:', (this.props as any).type);
            }
        }
    }
}
