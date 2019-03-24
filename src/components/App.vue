<template>
  <div id="app">
    <header class="header">
      <h1 class="site-title">Convert Video to GIF</h1>
    </header>
    <div
      class="select-file"
      :class="{'is-dragover': isDragenter}"
      @click="$refs.file.click()"
      @dragenter.stop.prevent="onDragenter"
      @dragover.stop.prevent="onDragenter"
      @dragleave.stop.prevent="onDragleave"
      @drop.stop.prevent="onDrop"
    >Select .mp4 / .ogg / .webm file</div>
    <input
      type="file"
      ref="file"
      aria-label="Select file"
      style="display:none"
      @change="handleFile"
      :accept="fileTypes.toString()"
    >
    <div class="preview">
      <div v-if="videoUrl" class="preview-item">
        <video crossorigin="anonymous" class="video" :src="videoUrl" muted loop controls></video>
      </div>
      <div v-if="videoUrl" class="preview-item">
        <img v-if="gif" class="gif" :src="gif" alt>
        <div v-else class="progress">{{ progress }}</div>
      </div>
    </div>
    <footer class="footer">
      Made by
      <a href="https://egoist.sh" target="_blank">EGOIST</a> -
      <a href="https://github.com/egoist/video2gif" target="_blank">Read Source Code on GitHub</a>
    </footer>
  </div>
</template>

<script>
import GIF from 'gif.js'
import workerScript from '!file-loader!gif.js/dist/gif.worker'

export default {
  data() {
    return {
      videoUrl: this.$route.query.video,
      gif: null,
      videoWidth: 800,
      progress: null,
      isDragenter: false,
      fileTypes: ['.mp4', '.ogg', '.webm']
    }
  },

  watch: {
    progress() {
      console.log(this.progress)
    }
  },

  mounted() {
    if (this.videoUrl) {
      this.convert()
    }
  },

  methods: {
    onDragenter(event) {
      this.isDragenter = true
    },

    onDragleave(event) {
      this.isDragenter = false
    },

    onDrop(event) {
      const file = event.dataTransfer.files[0]
      const fileType = '.' + file.type.split('/')[1]

      if (!this.fileTypes.includes(fileType)) {
        return
      }

      this.videoUrl = URL.createObjectURL(file)
      this.isDragenter = false
      this.convert()
    },

    async handleFile(e) {
      this.videoUrl = URL.createObjectURL(e.target.files[0])
      await this.convert()
    },

    reset() {
      this.gif = null
      this.progress = null
    },

    async convert() {
      this.reset()
      const video = await this.createVideo(this.videoUrl)
      const blob = await this.encodeGIF(video)
      const gifUrl = URL.createObjectURL(blob)
      this.gif = gifUrl
    },

    createVideo(url) {
      const video = document.createElement('video')

      video.crossOrigin = 'anonymous'
      video.muted = true
      video.src = url
      video.width = this.videoWidth

      this.progress = `Loading video..`

      return new Promise((resolve, reject) => {
        video.onerror = reject
        video.addEventListener('loadeddata', () => resolve(video))
      })
    },

    async encodeGIF(video) {
      this.progress = 'Converting..'

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      const width = (canvas.width =
        this.videoWidth > video.videoWidth ? video.videoWidth : this.videoWidth)
      const widthRatio = width / video.videoWidth
      const height = (canvas.height = widthRatio * video.videoHeight)

      const gif = new GIF({
        width,
        height,
        workers: 4,
        workerScript
      })

      return new Promise((resolve, reject) => {
        let lastTime = video.currentTime
        let lastPixels

        const capture = () => {
          ctx.drawImage(video, 0, 0, width, height)
          const pixels = ctx.getImageData(0, 0, width, height)

          const duration = video.currentTime - lastTime
          this.progress = `Reading Video ${((video.currentTime /
            video.duration) *
            100) |
            0}%..`

          if (!lastPixels || !isSameFrame(lastPixels, pixels)) {
            lastPixels = pixels
            lastTime = video.currentTime

            gif.addFrame(canvas, {
              copy: true,
              delay: duration * 1000
            })
          }

          if (!video.ended) {
            requestAnimationFrame(capture)
          } else {
            gif.render()
          }
        }

        requestAnimationFrame(capture)

        gif.on('finished', blob => {
          resolve(blob)
        })

        gif.on('progress', p => {
          this.progress = `Converting ${(p * 100) | 0}%..`
        })

        video.play()
        video.onerror = reject
      })
    }
  }
}

// let width = 400
// let height = video.videoHeight
// let heightRatio = 1
// if (video.videoWidth > 400) {
//   heightRatio = 400 / video.videoWidth
// }
// height = height * heightRatio

// canvas.height = height
// canvas.width = width
function isSameFrame(a, b) {
  if (a.data.length !== b.data.length) {
    return false
  }

  const max = a.data.length

  for (let i = 0; i < max; i++) {
    if (a.data[i] !== b.data[i]) {
      return false
    }
  }

  return true
}
</script>

<style scoped>
#app {
  max-width: 500px;
  margin: 0 auto;
  padding: 10px;
}

.select-file {
  border: 3px dashed #ccc;
  border-radius: 3px;
  padding: 40px 10px;
  text-align: center;
}

.select-file:hover {
  background: #f9f9f9;
  cursor: pointer;
}

.select-file.is-dragover {
  background: #f9f9f9;
}

.select-file.is-warn {
  background: hsl(348, 100%, 61%);
}

.video,
.gif {
  width: 100%;
}

.preview-item {
  margin-top: 20px;
}

.footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e2e2;
}
</style>
