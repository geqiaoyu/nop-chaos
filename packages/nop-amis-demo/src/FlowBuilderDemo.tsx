import {RenderOptions, RendererProps, render as renderAmis} from 'amis'

//import React from 'react'

import page from './flow-builder.page'
import { RootRenderProps } from 'amis-core/lib/Root'

import "@nop-chaos/nop-amis-ext"

function FlowBuilderDemo() {
  const options: RenderOptions = {
    loadRenderer(schema: any, path: string, reRender: Function){
      return "invalid"
    }
  }

  const props: RootRenderProps = {
    
  }

  return (
    <>
      {renderAmis(page as any, props, options)}
    </>
  )
}

export default FlowBuilderDemo
