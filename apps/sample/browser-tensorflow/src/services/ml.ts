import type { Tensor } from '@tensorflow/tfjs'
import * as tf from '@tensorflow/tfjs'

export class LinearRegression {
  model: tf.Sequential

  constructor(loss: string, optimizer: string) {
    this.model = tf.sequential()
    this.model.add(tf.layers.dense({ units: 1, inputShape: [1] }))
    this.model.compile({ loss, optimizer })
  }

  async train(xData: number[], yData: number[]) {
    const xs = tf.tensor2d(xData, [xData.length, 1])
    const ys = tf.tensor2d(yData, [yData.length, 1])
    await this.model.fit(xs, ys)
  }

  async predict(x: number) {
    return (await (this.model.predict(tf.tensor2d([x], [1, 1])) as Tensor).data())[0]
  }
}
